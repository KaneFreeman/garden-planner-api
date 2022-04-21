import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ContainerService } from './container.service';
import { ContainerController } from './container.controller';
import { ContainerSchema } from './schemas/container.schema';
import { TaskModule } from '../task/task.module';
import { PlantModule } from '../plant/plant.module';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'Container', schema: ContainerSchema }]), TaskModule, PlantModule],
  providers: [ContainerService],
  controllers: [ContainerController]
})
export class ContainerModule {}
