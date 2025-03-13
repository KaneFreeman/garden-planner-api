import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ContainerService } from '../container/container.service';
import { isNullish } from '../util/null.util';
import { GardenDTO, sanitizeGardenDTO } from './dto/garden.dto';
import { GardenDocument } from './interfaces/garden.document';
import { GardenProjection } from './interfaces/garden.projection';

@Injectable()
export class GardenService {
  constructor(
    @InjectModel('Garden') private readonly gardenModel: Model<GardenDocument>,
    @Inject(forwardRef(() => ContainerService)) private containerService: ContainerService
  ) {}

  async addGarden(createGardenDTO: GardenDTO, userId: string): Promise<GardenProjection> {
    const newGarden = await this.gardenModel.create({
      ...sanitizeGardenDTO(createGardenDTO),
      userId: new Types.ObjectId(userId)
    });
    return newGarden.save();
  }

  async getGarden(gardenId: string | null | undefined, userId: string): Promise<GardenProjection | null> {
    if (isNullish(gardenId)) {
      return null;
    }
    return this.gardenModel.findOne({ _id: gardenId, userId: new Types.ObjectId(userId) }).exec();
  }

  async getGardens(userId: string): Promise<GardenProjection[]> {
    return this.gardenModel.find({ userId: new Types.ObjectId(userId) }).exec();
  }

  async editGarden(gardenId: string, userId: string, createGardenDTO: GardenDTO): Promise<GardenProjection | null> {
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

  async deleteGarden(gardenId: string, userId: string): Promise<GardenProjection | null> {
    return this.gardenModel.findOneAndDelete({ _id: gardenId, userId: new Types.ObjectId(userId) });
  }

  async createUpdatePlantTasksForAllGardens(userId: string) {
    const gardens = await this.getGardens(userId);
    for (const garden of gardens) {
      if (garden.retired) {
        continue;
      }

      await this.containerService.createUpdatePlantTasksForAllContainers(userId, garden._id);
    }
  }
}
