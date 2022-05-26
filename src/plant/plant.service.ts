import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { PlantDTO } from './dto/plant.dto';
import { PlantDocument } from './interfaces/plant.interface';
import { isNullish } from '../util/null.util';
import { ContainerService } from '../container/container.service';
import { TaskService } from '../task/task.service';

@Injectable()
export class PlantService {
  constructor(
    @InjectModel('Plant') private readonly plantModel: Model<PlantDocument>,
    @Inject(forwardRef(() => ContainerService)) private containerService: ContainerService,
    private taskService: TaskService
  ) {}

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
    const oldPlant = await this.plantModel.findById(plantId);
    if (!oldPlant) {
      return null;
    }

    const updatedPlant = await this.plantModel.findByIdAndUpdate({ _id: { $eq: plantId } }, createPlantDTO, {
      new: true
    });

    if (oldPlant.name !== createPlantDTO.name) {
      await this.updateTasksWithNewPlantName(plantId, oldPlant.name, createPlantDTO.name);
    }

    await this.updateTasks(plantId);

    return updatedPlant;
  }

  async deletePlant(plantId: string): Promise<PlantDocument | null> {
    return this.plantModel.findByIdAndRemove(plantId);
  }

  async updateTasksWithNewPlantName(plantId: string, oldName: string, newName: string) {
    const containers = await this.containerService.getContainers();

    for (const container of containers) {
      if (!container.slots) {
        continue;
      }

      for (const [slotIndex, slot] of container.slots) {
        if (slot.plant === plantId) {
          const slotPath = `/container/${container._id}/slot/${slotIndex}`;
          await this.taskService.updatePlantName(slotPath, oldName, newName);
        }

        if (slot.subSlot?.plant === plantId) {
          const subSlotPath = `/container/${container._id}/slot/${slotIndex}/sub-slot`;
          await this.taskService.updatePlantName(subSlotPath, oldName, newName);
        }
      }
    }
  }

  async updateTasks(plantId: string) {
    const containers = await this.containerService.getContainers();

    for (const container of containers) {
      if (!container.slots) {
        continue;
      }

      for (const [_, slot] of container.slots) {
        if (slot.plant === plantId) {
          await this.containerService.createUpdatePlantTasks(container);
          break;
        }

        if (slot.subSlot?.plant === plantId) {
          await this.containerService.createUpdatePlantTasks(container);
          break;
        }
      }
    }
  }
}
