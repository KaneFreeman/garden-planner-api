import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { UserProjection } from '../../users/interfaces/user.projection';
import { UserService } from '../../users/user.service';
import { isNullish } from '../../util/null.util';
import { isEmpty } from '../../util/string.util';
import { SessionDTO } from '../dto/session.dto';
import { RefreshTokenService } from './refresh-token.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly logger: Logger,
    @Inject(forwardRef(() => UserService)) private userService: UserService,
    @Inject(forwardRef(() => RefreshTokenService)) private refreshTokenService: RefreshTokenService,
    private jwtService: JwtService
  ) {}

  async login(email: string, pass: string, deviceId: string): Promise<SessionDTO> {
    const user = await this.userService.getUserWithPasswordByEmail(email);
    if (isNullish(user)) {
      throw new NotFoundException('No user found');
    }

    if (isEmpty(user.password)) {
      throw new BadRequestException('No password set');
    }

    const match = await bcrypt.compare(pass, user.password);
    if (!match) {
      throw new UnauthorizedException('Invalid password');
    }

    return this.generateAccessToken(user._id, deviceId);
  }

  async generateAccessToken(userId: string, deviceId: string): Promise<SessionDTO> {
    const user = await this.userService.getUser(userId);
    if (isNullish(user)) {
      throw new NotFoundException('No user found');
    }

    const payload = this.generatePayload(user);

    return {
      ...payload,
      accessToken: await this.jwtService.signAsync(payload, { secret: `${process.env.JWT_SECRET}` }),
      refreshToken: await this.refreshTokenService.createRefreshToken(user._id, deviceId)
    };
  }

  async refreshAccessToken(refreshToken: string, deviceId: string) {
    try {
      this.jwtService.verify(refreshToken);

      const record = await this.refreshTokenService.getByRefreshTokenAndDeviceId(refreshToken, deviceId);
      if (!record) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const user = await this.userService.getUser(record.userId);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const payload = this.generatePayload(user);
      return {
        accessToken: await this.jwtService.signAsync(payload, { secret: `${process.env.JWT_SECRET}` })
      };
    } catch (e: unknown) {
      if (e instanceof Error) {
        this.logger.error(e.message);
        this.logger.error(e.stack);
      }
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  generatePayload(user: UserProjection): Omit<SessionDTO, 'accessToken' | 'refreshToken'> {
    return {
      userId: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName
    };
  }
}
