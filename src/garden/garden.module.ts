import { forwardRef, Logger, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ContainerModule } from '../container/container.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { GardenController } from './garden.controller';
import { GardenService } from './garden.service';
import { GardenSchema } from './schemas/garden.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Garden', schema: GardenSchema }]),
    forwardRef(() => ContainerModule),
    RealtimeModule
  ],
  providers: [GardenService, Logger],
  controllers: [GardenController],
  exports: [GardenService]
})
export class GardenModule {}
