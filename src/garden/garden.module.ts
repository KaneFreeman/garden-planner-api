import { Logger, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GardenController } from './garden.controller';
import { GardenService } from './garden.service';
import { GardenSchema } from './schemas/garden.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'Garden', schema: GardenSchema }])],
  providers: [GardenService, Logger],
  controllers: [GardenController],
  exports: [GardenService]
})
export class GardenModule {}
