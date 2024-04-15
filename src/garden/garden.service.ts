import { Injectable } from '@nestjs/common';
import { GardenDocument } from './interfaces/garden.interface';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { GardenDTO, sanitizeGardenDTO } from './dto/garden.dto';
import { isNullish } from '../util/null.util';

@Injectable()
export class GardenService {
  constructor(@InjectModel('Garden') private readonly gardenModel: Model<GardenDocument>) {}

  async addGarden(createGardenDTO: GardenDTO, userId: string): Promise<GardenDocument> {
    const newGarden = await this.gardenModel.create({
      ...sanitizeGardenDTO(createGardenDTO),
      userId: new Types.ObjectId(userId)
    });
    return newGarden.save();
  }

  async getGarden(gardenId: string | null | undefined, userId: string): Promise<GardenDocument | null> {
    if (isNullish(gardenId)) {
      return null;
    }
    return this.gardenModel.findOne({ _id: gardenId, userId: new Types.ObjectId(userId) }).exec();
  }

  async getGardens(userId: string): Promise<GardenDocument[]> {
    return this.gardenModel.find({ userId: new Types.ObjectId(userId) }).exec();
  }

  async editGarden(gardenId: string, userId: string, createGardenDTO: GardenDTO): Promise<GardenDocument | null> {
    const oldGarden = await this.getGarden(gardenId, userId);
    if (!oldGarden) {
      return null;
    }

    const updatedGarden = await this.gardenModel.findOneAndUpdate(
      { _id: gardenId, userId: new Types.ObjectId(userId) },
      sanitizeGardenDTO(createGardenDTO),
      {
        new: true
      }
    );

    return updatedGarden;
  }

  async deleteGarden(gardenId: string, userId: string): Promise<GardenDocument | null> {
    return this.gardenModel.findOneAndRemove({ _id: gardenId, userId: new Types.ObjectId(userId) });
  }
}
