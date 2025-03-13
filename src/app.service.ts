import { forwardRef, Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { UserService } from './users/user.service';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(
    private readonly logger: Logger,
    @Inject(forwardRef(() => UserService)) private userService: UserService
  ) {}

  async onModuleInit(): Promise<void> {
    this.logger.log('Recalculating all tasks...');
    await this.userService.createUpdatePlantTasksForAllUsers();
    this.logger.log('Recalculating of tasks complete.');
  }
}
