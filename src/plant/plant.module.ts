import { forwardRef, Logger, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ContainerModule } from '../container/container.module';
import { GardenModule } from '../garden/garden.module';
import { PlantInstanceModule } from '../plant-instance/plant-instance.module';
import { TaskModule } from '../task/task.module';
import { UserModule } from '../users/user.module';
import { PlantController } from './plant.controller';
import { PlantService } from './plant.service';
import { PlantSchema } from './schemas/plant.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Plant', schema: PlantSchema }]),
    forwardRef(() => ContainerModule),
    forwardRef(() => TaskModule),
    forwardRef(() => PlantInstanceModule),
    forwardRef(() => GardenModule),
    forwardRef(() => UserModule)
  ],
  providers: [PlantService, Logger],
  controllers: [PlantController],
  exports: [PlantService]
})
export class PlantModule {}
