import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';
import { TaskSchema } from './schemas/task.schema';
import { ContainerModule } from '../container/container.module';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'Task', schema: TaskSchema }]), forwardRef(() => ContainerModule)],
  providers: [TaskService],
  controllers: [TaskController],
  exports: [TaskService]
})
export class TaskModule {}
