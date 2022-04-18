import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';
import { TaskSchema } from './schemas/task.schema';
import { AuthenticationMiddleware } from '../common/authentication.middleware';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'Task', schema: TaskSchema }])],
  providers: [TaskService],
  controllers: [TaskController],
  exports: [TaskService]
})
export class TaskModule {
  configure(consumer: MiddlewareConsumer): MiddlewareConsumer | void {
    consumer
      .apply(AuthenticationMiddleware)
      .forRoutes(
        { method: RequestMethod.GET, path: '/api/task' },
        { method: RequestMethod.GET, path: '/api/task/:taskId' },
        { method: RequestMethod.POST, path: '/api/task' },
        { method: RequestMethod.PUT, path: '/api/task' },
        { method: RequestMethod.DELETE, path: '/api/task' }
      );
  }
}
