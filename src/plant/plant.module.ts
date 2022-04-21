import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PlantService } from './plant.service';
import { PlantController } from './plant.controller';
import { PlantSchema } from './schemas/plant.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'Plant', schema: PlantSchema }])],
  providers: [PlantService],
  controllers: [PlantController],
  exports: [PlantService]
})
export class PlantModule {}
