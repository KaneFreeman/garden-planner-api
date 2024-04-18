import { forwardRef, Logger, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ContainerModule } from '../container/container.module';
import { PlantInstanceModule } from '../plant-instance/plant-instance.module';
import { UserModule } from '../users/user.module';
import { TaskSchema } from './schemas/task.schema';
import { TaskTasksService } from './services/task-tasks.service';
import { TaskService } from './services/task.service';
import { TaskController } from './task.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Task', schema: TaskSchema }]),
    forwardRef(() => ContainerModule),
    forwardRef(() => PlantInstanceModule),
    forwardRef(() => UserModule)
  ],
  providers: [TaskService, TaskTasksService, Logger],
  controllers: [TaskController],
  exports: [TaskService]
})
export class TaskModule {}
