import { BadRequestException, Injectable } from '@nestjs/common';
import { UserDocument } from './interfaces/user.interface';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { CreateUserDTO, sanitizeCreateUserDTO } from './dto/create-user.dto';
import { isEmpty } from '../util/string.util';
import { isNullish } from '../util/null.util';

@Injectable()
export class UserService {
  private whitelist: string[];

  constructor(@InjectModel('User') private userModel: Model<UserDocument>) {
    this.whitelist = (process.env.USER_WHITELIST ?? '').split(',').map((email) => email.trim());
  }

  async createUser(createUserDTO: CreateUserDTO): Promise<UserDocument> {
    const sanitizedCreateUserDTO = sanitizeCreateUserDTO(createUserDTO);
    if (isNullish(sanitizedCreateUserDTO)) {
      throw new BadRequestException('No user details provided');
    }

    if (isEmpty(sanitizedCreateUserDTO.email)) {
      throw new BadRequestException('No email provided');
    }

    if (!this.whitelist.includes(sanitizedCreateUserDTO.email)) {
      throw new BadRequestException('Email not whitelisted');
    }

    if (isEmpty(sanitizedCreateUserDTO.password)) {
      throw new BadRequestException('No password provided');
    }

    const salt = await bcrypt.genSalt();
    const hashPassword = await bcrypt.hash(sanitizedCreateUserDTO.password, salt);

    const newUser = await this.userModel.create({
      ...sanitizedCreateUserDTO,
      password: hashPassword
    });

    return newUser.save();
  }

  async getUser(userId: string | null | undefined): Promise<UserDocument | null> {
    if (!userId) {
      return null;
    }

    return this.userModel.findById(userId).exec();
  }

  async getUserByEmail(email: string | null | undefined): Promise<UserDocument | null> {
    if (!email) {
      return null;
    }

    return this.userModel.findOne({ email }).exec();
  }

  async getUserWithPasswordByEmail(email: string | null | undefined): Promise<UserDocument | null> {
    if (!email) {
      return null;
    }

    return this.userModel.findOne({ email }).select('+password').exec();
  }
}
