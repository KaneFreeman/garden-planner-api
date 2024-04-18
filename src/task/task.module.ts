import { forwardRef, Logger, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TaskService } from './services/task.service';
import { TaskController } from './task.controller';
import { TaskSchema } from './schemas/task.schema';
import { ContainerModule } from '../container/container.module';
import { PlantInstanceModule } from '../plant-instance/plant-instance.module';
import { TaskTasksService } from './services/task-tasks.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Task', schema: TaskSchema }]),
    forwardRef(() => ContainerModule),
    forwardRef(() => PlantInstanceModule)
  ],
  providers: [TaskService, TaskTasksService, Logger],
  controllers: [TaskController],
  exports: [TaskService]
})
export class TaskModule {}
