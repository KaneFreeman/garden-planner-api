import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { growingZoneDataByZone, growingZonesByZipCode } from '../data/growingZoneData';
import { GrowingZoneData } from '../interface';
import { isEmpty, isNotEmpty } from '../util/string.util';
import { UserDTO, sanitizeUserDTO } from './dto/user.dto';
import { UserDocument } from './interfaces/user.document';
import { UserProjection } from './interfaces/user.projection';

@Injectable()
export class UserService {
  private whitelist: string[];

  constructor(
    private logger: Logger,
    @InjectModel('User') private userModel: Model<UserDocument>
  ) {
    this.whitelist = (process.env.USER_WHITELIST ?? '').split(',').map((email) => email.trim());
  }

  async createUser(userDTO: UserDTO): Promise<UserProjection> {
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
      ...sanitizedUserDTO,
      password: this.generateHashedPassword(sanitizedUserDTO.password)
    });

    return newUser.save();
  }

  async generateHashedPassword(newPassword: string | undefined): Promise<string> {
    if (isEmpty(newPassword)) {
      throw new BadRequestException('No password provided');
    }

    if (isEmpty(newPassword)) {
      throw new BadRequestException('Password must be at least 8');
    }

    const salt = await bcrypt.genSalt();
    return bcrypt.hash(newPassword, salt);
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

  async getUserWithPasswordByEmail(email: string | null | undefined): Promise<UserProjection | null> {
    if (!email) {
      return null;
    }

    return this.userModel.findOne({ email }).select('+password').exec();
  }

  async getUsers(): Promise<UserProjection[]> {
    return this.userModel.find().exec();
  }

  async updateUser(userId: string, userDTO: UserDTO): Promise<UserProjection | null> {
    const sanitizedUserDTO = sanitizeUserDTO(userDTO);

    const changes: {
      password?: string;
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

    if (isNotEmpty(sanitizedUserDTO.password)) {
      changes.password = await this.generateHashedPassword(sanitizedUserDTO.password);
    }

    return this.userModel.findByIdAndUpdate(userId, changes, { new: true });
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
}
