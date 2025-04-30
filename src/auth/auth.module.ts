import { Logger, Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { MailModule } from '../mail/mail.module';
import { UserModule } from '../users/user.module';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { TokenSchema } from './schemas/token.schema';
import { AuthService } from './services/auth.service';
import { TokenService } from './services/token.service';
import { RefreshTokenSchema } from './schemas/refresh-token.schema';
import { RefreshTokenService } from './services/refresh-token.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Token', schema: TokenSchema },
      { name: 'RefreshToken', schema: RefreshTokenSchema }
    ]),
    forwardRef(() => MailModule),
    forwardRef(() => UserModule),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '2h' }
    })
  ],
  providers: [AuthService, TokenService, RefreshTokenService, AuthGuard, Logger],
  controllers: [AuthController],
  exports: [AuthService, TokenService, RefreshTokenService, AuthGuard]
})
export class AuthModule {}
