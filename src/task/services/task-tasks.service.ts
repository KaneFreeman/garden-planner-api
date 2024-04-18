import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { TaskService } from './task.service';

@Injectable()
export class TaskTasksService {
  constructor(
    private readonly logger: Logger,
    @Inject(forwardRef(() => TaskService)) private taskService: TaskService
  ) {}

  @Cron('0 7 * * *')
  async handleCron() {
    this.logger.log('Deleting orphaned tasks...');
    await this.taskService.deleteOrphanedTasks();
    this.logger.log('Orphaned tasks deleted.');
  }
}
