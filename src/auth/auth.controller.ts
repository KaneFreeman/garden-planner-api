import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { GenerateTokenDTO } from './dto/generateToken.dto';
import { LoginDTO } from './dto/login.dto';
import { RequestWithUser } from './dto/requestWithUser';
import { SessionDTO } from './dto/session.dto';
import { ValidateTokenDTO } from './dto/validateToken.dto';
import { AuthService } from './services/auth.service';
import { TokenService } from './services/token.service';

@Controller('/api/auth')
export class AuthController {
  constructor(private authService: AuthService, private tokenService: TokenService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  signIn(@Body() loginDTO: LoginDTO): Promise<SessionDTO> {
    return this.authService.login(loginDTO.email, loginDTO.password);
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
  async validateToken(@Body() validateTokenDTO: ValidateTokenDTO): Promise<SessionDTO> {
    return this.tokenService.loginWithToken(validateTokenDTO);
  }
}
