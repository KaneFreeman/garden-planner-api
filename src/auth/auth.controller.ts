import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { GenerateTokenDTO } from './dto/generateToken.dto';
import { LoginDTO } from './dto/login.dto';
import { RequestWithUser } from './dto/requestWithUser';
import { SessionDTO } from './dto/session.dto';
import { ValidateTokenDTO } from './dto/validateToken.dto';
import { AuthService } from './services/auth.service';
import { TokenService } from './services/token.service';
import { ResponseWithDeviceId } from '../interface';

@Controller('/api/auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private tokenService: TokenService
  ) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  signIn(@Body() loginDTO: LoginDTO, @Req() req: ResponseWithDeviceId): Promise<SessionDTO> {
    return this.authService.login(loginDTO.email, loginDTO.password, req.deviceId);
  }

  @HttpCode(HttpStatus.OK)
  @Post('refresh-token')
  refreshToken(
    @Body('refreshToken') refreshToken: string,
    @Req() req: ResponseWithDeviceId
  ): Promise<{ accessToken: string }> {
    return this.authService.refreshAccessToken(refreshToken, req.deviceId);
  }

  @UseGuards(AuthGuard)
  @Get('profile')
  getProfile(@Req() req: RequestWithUser): Omit<SessionDTO, 'accessToken'> {
    return req.user;
  }

  @Post('token/generate')
  async generateToken(@Body() generateTokenDTO: GenerateTokenDTO): Promise<{ status: string }> {
    await this.tokenService.generateToken(generateTokenDTO);
    return { status: 'success' };
  }

  @Post('token/validate')
  async validateToken(
    @Body() validateTokenDTO: ValidateTokenDTO,
    @Req() req: ResponseWithDeviceId
  ): Promise<SessionDTO> {
    return this.tokenService.loginWithToken(validateTokenDTO, req.deviceId);
  }
}
