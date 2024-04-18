import { BadRequestException, Inject, Injectable, Logger, NotFoundException, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { addMinutes } from 'date-fns';
import { Model, Types } from 'mongoose';
import { MailService } from '../../mail/services/mail.service';
import { UserService } from '../../users/user.service';
import { GenerateTokenDTO, sanitizeGenerateTokenDTO } from '../dto/generateToken.dto';
import { SessionDTO } from '../dto/session.dto';
import { ValidateTokenDTO, sanitizeValidateTokenDTO } from '../dto/validateToken.dto';
import { TokenDocument } from '../interfaces/token.document';
import { TokenProjection } from '../interfaces/token.projection';
import { AuthService } from './auth.service';

@Injectable()
export class TokenService {
  constructor(
    private logger: Logger,
    @InjectModel('Token') private tokenModel: Model<TokenDocument>,
    @Inject(forwardRef(() => AuthService)) private authService: AuthService,
    @Inject(forwardRef(() => MailService)) private mailService: MailService,
    @Inject(forwardRef(() => UserService)) private userService: UserService
  ) {}

  async generateToken(dto: GenerateTokenDTO): Promise<TokenProjection> {
    const sanitizedGenerateTokenDTO = sanitizeGenerateTokenDTO(dto);

    const user = await this.userService.getUserByEmail(sanitizedGenerateTokenDTO.email);
    if (!user) {
      throw new NotFoundException('No user found');
    }

    const token = Math.floor(100000 + Math.random() * 900000);

    await this.tokenModel.deleteMany({ email: sanitizedGenerateTokenDTO.email });

    this.logger.log(`user._id: ${typeof user._id}, ${user._id}`);

    const newToken = await this.tokenModel.create({
      userId: new Types.ObjectId(user._id),
      email: sanitizedGenerateTokenDTO.email,
      token,
      expires: addMinutes(new Date(), 5)
    });

    const savedToken = await newToken.save();

    await this.mailService.sendTokenEmail(user.email, savedToken.token);

    return savedToken;
  }

  async loginWithToken(dto: ValidateTokenDTO): Promise<SessionDTO> {
    const sanitizedValidateTokenDTO = sanitizeValidateTokenDTO(dto);

    const tokenRecord = await this.tokenModel.findOneAndDelete({
      token: sanitizedValidateTokenDTO.token,
      email: sanitizedValidateTokenDTO.email,
      expires: { $gte: new Date() }
    });

    if (!tokenRecord) {
      throw new BadRequestException('Bad code');
    }

    const user = await this.userService.getUser(tokenRecord.userId);
    if (!user) {
      throw new NotFoundException('No user found');
    }

    return this.authService.generateAccessToken(user._id);
  }
}
