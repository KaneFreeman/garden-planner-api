import { forwardRef, Logger, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GardenModule } from '../garden/garden.module';
import { PlantInstanceModule } from '../plant-instance/plant-instance.module';
import { PlantModule } from '../plant/plant.module';
import { TaskModule } from '../task/task.module';
import { UserModule } from '../users/user.module';
import { ContainerController } from './container.controller';
import { ContainerService } from './container.service';
import { ContainerSchema } from './schemas/container.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Container', schema: ContainerSchema }]),
    forwardRef(() => GardenModule),
    forwardRef(() => PlantInstanceModule),
    forwardRef(() => PlantModule),
    forwardRef(() => TaskModule),
    forwardRef(() => UserModule)
  ],
  providers: [ContainerService, Logger],
  controllers: [ContainerController],
  exports: [ContainerService]
})
export class ContainerModule {}
