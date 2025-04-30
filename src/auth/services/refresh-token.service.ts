import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RefreshTokenDocument } from '../interfaces/refresh-token.document';
import { RefreshTokenProjection } from '../interfaces/refresh-token.projection';

@Injectable()
export class RefreshTokenService {
  constructor(
    private logger: Logger,
    @InjectModel('RefreshToken') private refreshTokenModel: Model<RefreshTokenDocument>,
    private jwtService: JwtService
  ) {}

  async createRefreshToken(userId: string, deviceId: string): Promise<string> {
    const refreshToken = this.jwtService.sign({}, { expiresIn: '2w' });
    this.refreshTokenModel.create({
      userId,
      deviceId,
      refreshToken
    });
    return refreshToken;
  }

  async getByRefreshTokenAndDeviceId(
    refreshToken: string | null | undefined,
    deviceId: string | null | undefined
  ): Promise<RefreshTokenProjection | null> {
    if (!refreshToken || !deviceId) {
      return null;
    }

    return this.refreshTokenModel.findOne({ refreshToken, deviceId }).exec();
  }

  async update(
    record: RefreshTokenProjection,
    changes: Partial<Omit<RefreshTokenProjection, '_id'>>
  ): Promise<RefreshTokenProjection | null> {
    return this.refreshTokenModel.findByIdAndUpdate(record._id, changes, { new: true });
  }
}
