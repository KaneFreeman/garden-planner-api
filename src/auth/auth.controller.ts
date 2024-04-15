import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { LoginDTO } from './dto/login.dto';
import { RequestWithUser } from './dto/requestWithUser';
import { SessionDTO } from './dto/session.dto';

@Controller('/api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

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
}
