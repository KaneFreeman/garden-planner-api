import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from '../users/user.service';
import { isNullish } from '../util/null.util';
import { isEmpty } from '../util/string.util';
import { SessionDTO } from './dto/session.dto';

@Injectable()
export class AuthService {
  constructor(private userService: UserService, private jwtService: JwtService) {}

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

    const payload = {
      userId: user._id,
      email: user.email
    };

    return {
      ...payload,
      access_token: await this.jwtService.signAsync(payload, { secret: `${process.env.JWT_SECRET}` })
    };
  }
}
