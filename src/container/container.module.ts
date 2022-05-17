import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ContainerService } from './container.service';
import { ContainerController } from './container.controller';
import { ContainerSchema } from './schemas/container.schema';
import { TaskModule } from '../task/task.module';
import { PlantModule } from '../plant/plant.module';
import { PlantInstanceModule } from '../plant-instance/plant-instance.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Container', schema: ContainerSchema }]),
    TaskModule,
    forwardRef(() => PlantModule),
    forwardRef(() => PlantInstanceModule)
  ],
  providers: [ContainerService],
  controllers: [ContainerController],
  exports: [ContainerService]
})
export class ContainerModule {}
