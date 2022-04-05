import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { PlantDTO } from './dto/plant.dto';
import { Plant } from './interfaces/plant.interface';

@Injectable()
export class PlantService {
  constructor(
    @InjectModel('Plant') private readonly plantModel: Model<Plant>,
  ) {}

  async addPlant(createPlantDTO: PlantDTO): Promise<Plant> {
    const newPlant = await this.plantModel.create(createPlantDTO);
    return newPlant.save();
  }

  async getPlant(plantId): Promise<Plant> {
    const plant = await this.plantModel.findById(plantId).exec();
    return plant;
  }

  async getPlants(): Promise<Plant[]> {
    const plants = await this.plantModel.find().exec();
    return plants;
  }

  async editPlant(plantId, createPlantDTO: PlantDTO): Promise<Plant> {
    const editedPlant = await this.plantModel.findByIdAndUpdate(
      plantId,
      createPlantDTO,
      { new: true },
    );
    return editedPlant;
  }

  async deletePlant(plantId): Promise<Plant> {
    const deletedPlant = await this.plantModel.findByIdAndRemove(plantId);
    return deletedPlant;
  }
}
