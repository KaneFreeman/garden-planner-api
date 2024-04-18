import { forwardRef, Logger, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ContainerModule } from '../container/container.module';
import { PlantModule } from '../plant/plant.module';
import { TaskModule } from '../task/task.module';
import { UserModule } from '../users/user.module';
import { PlantInstanceController } from './plant-instance.controller';
import { PlantInstanceService } from './plant-instance.service';
import { PlantInstanceSchema } from './schemas/plant-instance.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'PlantInstance', schema: PlantInstanceSchema }]),
    forwardRef(() => TaskModule),
    forwardRef(() => PlantModule),
    forwardRef(() => ContainerModule),
    forwardRef(() => UserModule)
  ],
  providers: [PlantInstanceService, Logger],
  controllers: [PlantInstanceController],
  exports: [PlantInstanceService]
})
export class PlantInstanceModule {}
