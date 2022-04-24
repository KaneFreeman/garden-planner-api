import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { PlantDTO } from './dto/plant.dto';
import { PlantDocument } from './interfaces/plant.interface';
import { isNullish } from '../util/null.util';

@Injectable()
export class PlantService {
  constructor(@InjectModel('Plant') private readonly plantModel: Model<PlantDocument>) {}

  async addPlant(createPlantDTO: PlantDTO): Promise<PlantDocument> {
    const newPlant = await this.plantModel.create(createPlantDTO);
    return newPlant.save();
  }

  async getPlant(plantId: string | null | undefined): Promise<PlantDocument | null> {
    if (isNullish(plantId)) {
      return null;
    }
    return this.plantModel.findById(plantId).exec();
  }

  async getPlants(): Promise<PlantDocument[]> {
    return this.plantModel.find().exec();
  }

  async editPlant(plantId: string, createPlantDTO: PlantDTO): Promise<PlantDocument | null> {
    return this.plantModel.findByIdAndUpdate(plantId, createPlantDTO, {
      new: true
    });
  }

  async deletePlant(plantId: string): Promise<PlantDocument | null> {
    return this.plantModel.findByIdAndRemove(plantId);
  }
}
