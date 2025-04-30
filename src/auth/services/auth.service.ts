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
import * as bcrypt from 'bcrypt';
import { UserProjection } from '../../users/interfaces/user.projection';
import { UserService } from '../../users/user.service';
import { isNullish } from '../../util/null.util';
import { isEmpty } from '../../util/string.util';
import { SessionDTO } from '../dto/session.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly logger: Logger,
    @Inject(forwardRef(() => UserService)) private userService: UserService,
    private jwtService: JwtService
  ) {}

  async login(email: string, pass: string): Promise<SessionDTO> {
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

    return this.generateAccessToken(user._id);
  }

  async generateAccessToken(userId: string): Promise<SessionDTO> {
    const user = await this.userService.getUser(userId);
    if (isNullish(user)) {
      throw new NotFoundException('No user found');
    }

    const payload = this.generatePayload(user);

    return {
      ...payload,
      accessToken: await this.jwtService.signAsync(payload, { secret: `${process.env.JWT_SECRET}` }),
      refreshToken: await this.createRefreshToken(user)
    };
  }

  async createRefreshToken(user: UserProjection): Promise<string> {
    const refreshToken = this.jwtService.sign({}, { expiresIn: '2w' });
    this.userService.updateUserRefreshToken(user._id, refreshToken);
    return refreshToken;
  }

  async refreshAccessToken(refreshToken: string) {
    try {
      this.jwtService.verify(refreshToken);

      const user = await this.userService.getUserByRefreshToken(refreshToken);
      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const payload = this.generatePayload(user);
      return {
        accessToken: await this.jwtService.signAsync(payload, { secret: `${process.env.JWT_SECRET}` })
      };
    } catch (e: unknown) {
      if (e instanceof Error) {
        this.logger.error(e.message, e);
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
