import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';
import { SessionDTO } from '../auth/dto/session.dto';
import { AuthenticatedSocket, RealtimeSession } from './interfaces/authenticated-socket.interface';

@Injectable()
export class RealtimeAuthService {
  constructor(private readonly jwtService: JwtService) {}

  async authenticate(client: AuthenticatedSocket): Promise<RealtimeSession> {
    const token = this.extractToken(client);
    if (!token) {
      throw new UnauthorizedException('Missing realtime token');
    }

    try {
      return await this.jwtService.verifyAsync<Omit<SessionDTO, 'accessToken' | 'refreshToken'>>(token, {
        secret: process.env.JWT_SECRET
      });
    } catch {
      throw new UnauthorizedException('Invalid realtime token');
    }
  }

  private extractToken(client: Socket): string | undefined {
    const authToken = client.handshake.auth?.token;
    if (typeof authToken === 'string' && authToken.length > 0) {
      return authToken;
    }

    const [type, token] = client.handshake.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
