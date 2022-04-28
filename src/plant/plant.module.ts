import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PlantService } from './plant.service';
import { PlantController } from './plant.controller';
import { PlantSchema } from './schemas/plant.schema';
import { ContainerModule } from '../container/container.module';
import { TaskModule } from '../task/task.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Plant', schema: PlantSchema }]),
    forwardRef(() => ContainerModule),
    TaskModule
  ],
  providers: [PlantService],
  controllers: [PlantController],
  exports: [PlantService]
})
export class PlantModule {}
