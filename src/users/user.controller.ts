import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CreateUserDTO } from './dto/create-user.dto';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @HttpCode(HttpStatus.OK)
  @Post('')
  async createUser(@Body() createUserDTO: CreateUserDTO): Promise<{ status: string }> {
    await this.userService.createUser(createUserDTO);
    return { status: 'success' };
  }
}
