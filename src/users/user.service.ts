import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
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
    } = {
      firstName: sanitizedUserDTO.firstName,
      lastName: sanitizedUserDTO.lastName,
      summaryEmail: sanitizedUserDTO.summaryEmail
    };

    if (isNotEmpty(sanitizedUserDTO.password)) {
      changes.password = await this.generateHashedPassword(sanitizedUserDTO.password);
    }

    return this.userModel.findByIdAndUpdate(userId, changes, { new: true });
  }
}
