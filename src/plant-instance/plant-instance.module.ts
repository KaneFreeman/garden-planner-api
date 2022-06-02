import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PlantInstanceService } from './plant-instance.service';
import { PlantInstanceController } from './plant-instance.controller';
import { PlantInstanceSchema } from './schemas/plant-instance.schema';
import { TaskModule } from '../task/task.module';
import { PlantModule } from '../plant/plant.module';
import { ContainerModule } from '../container/container.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'PlantInstance', schema: PlantInstanceSchema }]),
    forwardRef(() => TaskModule),
    forwardRef(() => PlantModule),
    forwardRef(() => ContainerModule)
  ],
  providers: [PlantInstanceService],
  controllers: [PlantInstanceController],
  exports: [PlantInstanceService]
})
export class PlantInstanceModule {}
