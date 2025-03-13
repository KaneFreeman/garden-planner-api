import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ContainerService } from '../container/container.service';
import { GardenService } from '../garden/garden.service';
import { PlantInstanceService } from '../plant-instance/plant-instance.service';
import { TaskService } from '../task/services/task.service';
import { UserService } from '../users/user.service';
import { isNullish } from '../util/null.util';
import { PlantDTO, sanitizePlantDTO } from './dto/plant.dto';
import { PlantDocument } from './interfaces/plant.document';
import { PlantProjection } from './interfaces/plant.projection';

@Injectable()
export class PlantService {
  constructor(
    @InjectModel('Plant') private readonly plantModel: Model<PlantDocument>,
    @Inject(forwardRef(() => ContainerService)) private containerService: ContainerService,
    @Inject(forwardRef(() => TaskService)) private taskService: TaskService,
    @Inject(forwardRef(() => PlantInstanceService)) private plantInstanceService: PlantInstanceService,
    @Inject(forwardRef(() => GardenService)) private gardenService: GardenService,
    @Inject(forwardRef(() => UserService)) private userService: UserService
  ) {}

  async addPlant(createPlantDTO: PlantDTO, userId: string): Promise<PlantProjection> {
    const newPlant = await this.plantModel.create({
      ...sanitizePlantDTO(createPlantDTO),
      userId: new Types.ObjectId(userId)
    });
    return newPlant.save();
  }

  async getPlant(plantId: string | null | undefined, userId: string): Promise<PlantProjection | null> {
    if (isNullish(plantId)) {
      return null;
    }
    return this.plantModel.findOne({ _id: plantId, userId }).exec();
  }

  async getPlants(userId: string): Promise<PlantProjection[]> {
    return this.plantModel.find({ userId }).exec();
  }

  async editPlant(plantId: string, userId: string, createPlantDTO: PlantDTO): Promise<PlantProjection | null> {
    const oldPlant = await this.getPlant(plantId, userId);
    if (!oldPlant) {
      return null;
    }

    const updatedPlant = await this.plantModel.findOneAndUpdate(
      { _id: plantId, userId },
      sanitizePlantDTO(createPlantDTO),
      {
        new: true
      }
    );

    const gardens = await this.gardenService.getGardens(userId);
    for (const garden of gardens) {
      if (oldPlant.name !== createPlantDTO.name) {
        await this.updateTasksWithNewPlantName(plantId, userId, garden._id, oldPlant.name, createPlantDTO.name);
      }

      await this.updateTasks(userId, garden._id, plantId);
    }

    return updatedPlant;
  }

  async deletePlant(plantId: string, userId: string): Promise<PlantProjection | null> {
    return this.plantModel.findOneAndDelete({ _id: plantId, userId });
  }

  async updateTasksWithNewPlantName(
    plantId: string,
    userId: string,
    gardenId: string,
    oldName: string,
    newName: string
  ) {
    const plantInstances = await this.plantInstanceService.getPlantInstancesByPlant(plantId, userId, gardenId);

    for (const plantInstance of plantInstances) {
      if (plantInstance._id) {
        await this.taskService.updatePlantName(plantInstance._id, userId, gardenId, oldName, newName);
      }
    }
  }

  async updateTasks(userId: string, gardenId: string, plantId: string) {
    await this.containerService.createUpdatePlantTasksForAllContainers(userId, gardenId, plantId);
  }
}
