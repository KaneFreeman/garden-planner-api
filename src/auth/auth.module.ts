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

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Token', schema: TokenSchema }]),
    forwardRef(() => MailModule),
    forwardRef(() => UserModule),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '2 days' }
    })
  ],
  providers: [AuthService, TokenService, AuthGuard, Logger],
  controllers: [AuthController],
  exports: [AuthService, TokenService, AuthGuard]
})
export class AuthModule {}
