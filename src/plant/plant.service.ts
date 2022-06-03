import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { isNullish } from '../util/null.util';
import { ContainerService } from '../container/container.service';
import { TaskService } from '../task/task.service';
import { PlantInstanceService } from '../plant-instance/plant-instance.service';
import { PlantDTO, sanitizePlantDTO } from './dto/plant.dto';
import { PlantDocument } from './interfaces/plant.interface';

@Injectable()
export class PlantService {
  constructor(
    @InjectModel('Plant') private readonly plantModel: Model<PlantDocument>,
    @Inject(forwardRef(() => ContainerService)) private containerService: ContainerService,
    private taskService: TaskService,
    @Inject(forwardRef(() => PlantInstanceService)) private plantInstanceService: PlantInstanceService
  ) {}

  async addPlant(createPlantDTO: PlantDTO): Promise<PlantDocument> {
    const newPlant = await this.plantModel.create(sanitizePlantDTO(createPlantDTO));
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

    const updatedPlant = await this.plantModel.findByIdAndUpdate(plantId, sanitizePlantDTO(createPlantDTO), {
      new: true
    });

    if (oldPlant.name !== createPlantDTO.name) {
      await this.updateTasksWithNewPlantName(plantId, oldPlant.name, createPlantDTO.name);
    }

    await this.updateTasks();

    return updatedPlant;
  }

  async deletePlant(plantId: string): Promise<PlantDocument | null> {
    return this.plantModel.findByIdAndRemove(plantId);
  }

  async updateTasksWithNewPlantName(plantId: string, oldName: string, newName: string) {
    const plantInstances = await this.plantInstanceService.getPlantInstancesByPlant(plantId);

    for (const plantInstance of plantInstances) {
      if (plantInstance._id) {
        await this.taskService.updatePlantName(plantInstance._id, oldName, newName);
      }
    }
  }

  async updateTasks() {
    const containers = await this.containerService.getContainers();

    for (const container of containers) {
      await this.containerService.createUpdatePlantTasks(container);
    }
  }
}
