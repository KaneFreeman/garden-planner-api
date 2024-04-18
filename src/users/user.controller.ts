import { Body, Controller, Get, HttpCode, HttpStatus, Post, Put, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { RequestWithUser } from '../auth/dto/requestWithUser';
import { UserDTO } from './dto/user.dto';
import { UserProjection } from './interfaces/user.projection';
import { UserService } from './user.service';

@Controller('/api/user')
export class UserController {
  constructor(private userService: UserService) {}

  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @Get('')
  async getUser(@Req() req: RequestWithUser): Promise<UserProjection | null> {
    return this.userService.getUser(req.user.userId);
  }

  @HttpCode(HttpStatus.OK)
  @Post('')
  async createUser(@Body() userDTO: UserDTO): Promise<{ status: string }> {
    await this.userService.createUser(userDTO);
    return { status: 'success' };
  }

  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @Put('')
  async updateUser(@Req() req: RequestWithUser, @Body() userDTO: UserDTO): Promise<UserProjection | null> {
    return this.userService.updateUser(req.user.userId, userDTO);
  }
}
