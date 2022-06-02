import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TaskModule } from '../task/task.module';
import { PlantModule } from '../plant/plant.module';
import { ContainerModule } from '../container/container.module';
import { PlantInstanceModule } from '../plant-instance/plant-instance.module';
import { ContainerSchema } from './schemas/container.schema';
import { TaskSchema } from './schemas/task.schema';
import { OldTaskService } from './old-task.service';
import { OldContainerService } from './old-container.service';
import { MigrationService } from './migration.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'old-container', schema: ContainerSchema },
      { name: 'old-task', schema: TaskSchema }
    ]),
    forwardRef(() => TaskModule),
    forwardRef(() => PlantModule),
    forwardRef(() => ContainerModule),
    forwardRef(() => PlantInstanceModule)
  ],
  providers: [MigrationService, OldContainerService, OldTaskService],
  exports: [MigrationService]
})
export class MigrationModule {}
