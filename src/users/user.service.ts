import { BadRequestException, forwardRef, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { growingZoneDataByZone, growingZonesByZipCode } from '../data/growingZoneData';
import { GrowingZoneData } from '../interface';
import { RealtimePublisher } from '../realtime/realtime.publisher';
import { StaticService } from '../static/static.service';
import { isEmpty } from '../util/string.util';
import { UserDTO, sanitizeUserDTO } from './dto/user.dto';
import { UserDocument } from './interfaces/user.document';
import { UserProjection } from './interfaces/user.projection';
import { GardenService } from '../garden/garden.service';

@Injectable()
export class UserService {
  private whitelist: string[];

  constructor(
    private logger: Logger,
    @InjectModel('User') private userModel: Model<UserDocument>,
    @Inject(forwardRef(() => GardenService)) private gardenService: GardenService,
    @Inject(forwardRef(() => StaticService)) private staticService: StaticService,
    private readonly realtimePublisher: RealtimePublisher
  ) {
    this.whitelist = (process.env.USER_WHITELIST ?? '').split(',').map((email) => email.trim());
  }

  async createUser(userDTO: UserDTO): Promise<UserProjection> {
    this.assertNoPasswordField(userDTO);

    const sanitizedUserDTO = sanitizeUserDTO(userDTO);
    if (isEmpty(sanitizedUserDTO.email)) {
      throw new BadRequestException('No email provided');
    }

    if (!this.whitelist.includes(sanitizedUserDTO.email)) {
      throw new BadRequestException('Email not whitelisted');
    }

    const existingUser = await this.getUserByEmail(sanitizedUserDTO.email);
    if (existingUser) {
      throw new BadRequestException('Account already exists for email');
    }

    const newUser = await this.userModel.create({
      ...sanitizedUserDTO
    });

    return newUser.save();
  }

  async getUser(userId: string | null | undefined): Promise<UserProjection | null> {
    if (!userId) {
      return null;
    }

    return this.userModel.findById(userId).exec();
  }

  async getUserByEmail(email: string | null | undefined): Promise<UserProjection | null> {
    if (!email) {
      return null;
    }

    return this.userModel.findOne({ email }).exec();
  }

  async getUsers(): Promise<UserProjection[]> {
    return this.userModel.find().exec();
  }

  async updateUser(userId: string, userDTO: UserDTO): Promise<UserProjection | null> {
    this.assertNoPasswordField(userDTO);

    const sanitizedUserDTO = sanitizeUserDTO(userDTO);

    const changes: {
      firstName: string;
      lastName: string;
      summaryEmail: boolean;
      zipCode: string;
    } = {
      firstName: sanitizedUserDTO.firstName,
      lastName: sanitizedUserDTO.lastName,
      summaryEmail: sanitizedUserDTO.summaryEmail,
      zipCode: sanitizedUserDTO.zipCode
    };

    const updatedUser = await this.userModel.findByIdAndUpdate(userId, changes, { returnDocument: 'after' });

    if (updatedUser) {
      await this.publishUserSync(userId, 'user.updated');
    }

    return updatedUser;
  }

  private assertNoPasswordField(userDTO: UserDTO) {
    if (Object.prototype.hasOwnProperty.call(userDTO, 'password')) {
      throw new BadRequestException('Password authentication has been removed');
    }
  }

  async getGrowingZoneData(userId: string): Promise<GrowingZoneData> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new NotFoundException('No user found');
    }

    if (!(user.zipCode in growingZonesByZipCode)) {
      throw new NotFoundException('Unknown zip code');
    }

    const growingZone = growingZonesByZipCode[user.zipCode];

    if (!(growingZone in growingZoneDataByZone)) {
      throw new NotFoundException('No growing zone data');
    }

    const data = growingZoneDataByZone[growingZone];
    if (!data) {
      throw new NotFoundException('No growing zone data');
    }

    const year = new Date().getFullYear();

    return {
      zone: data.zone,
      lastFrost: data.lastFrost ? new Date(year, data.lastFrost.month, data.lastFrost.day) : undefined,
      firstFrost: data.firstFrost ? new Date(year, data.firstFrost.month, data.firstFrost.day) : undefined
    };
  }

  async createUpdatePlantTasksForAllUsers() {
    const users = await this.getUsers();
    for (const user of users) {
      await this.gardenService.createUpdatePlantTasksForAllGardens(user._id);
    }
  }

  private async publishUserSync(userId: string, reason: string) {
    const [userDetails, plantData] = await Promise.all([
      this.getUser(userId),
      this.staticService.getPlantData(userId).catch(() => undefined)
    ]);

    this.realtimePublisher.publishUserSync(userId, reason, {
      plantData,
      userDetails
    });
  }
}
