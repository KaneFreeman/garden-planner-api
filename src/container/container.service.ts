import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { ContainerDTO } from './dto/container.dto';
import { Container } from './interfaces/container.interface';
import { TaskService } from '../task/task.service';
import { PlantService } from '../plant/plant.service';
import plantData from '../data/plantData';
import getSlotTitle from '../util/slot.util';

@Injectable()
export class ContainerService {
  constructor(
    @InjectModel('Container') private readonly containerModel: Model<Container>,
    private plantService: PlantService,
    private taskService: TaskService,
  ) {}

  async addContainer(createContainerDTO: ContainerDTO): Promise<Container> {
    const newContainer = await this.containerModel.create(createContainerDTO);
    return newContainer.save();
  }

  async getContainer(containerId): Promise<Container> {
    const container = await this.containerModel.findById(containerId).exec();
    return container;
  }

  async getContainers(): Promise<Container[]> {
    const containers = await this.containerModel.find().exec();
    return containers;
  }

  async editContainer(
    containerId,
    createContainerDTO: ContainerDTO,
  ): Promise<Container> {
    const editedContainer = await this.containerModel.findByIdAndUpdate(
      containerId,
      createContainerDTO,
      { new: true },
    );
    await this.createUpdatePlantTasks(editedContainer);
    return editedContainer;
  }

  async deleteContainer(containerId): Promise<Container> {
    const deletedContainer = await this.containerModel.findByIdAndRemove(
      containerId,
    );
    return deletedContainer;
  }

  async createUpdatePlantTasks(container: Container | undefined) {
    if (!container?.slots) {
      return;
    }

    const { slots } = container;

    slots.forEach(async (slot, slotIndex) => {
      if (!slot?.plant) {
        return;
      }

      const plant = await this.plantService.getPlant(slot.plant);
      if (!plant?.type) {
        return;
      }

      const data = plantData[plant.type];
      if (!data) {
        return;
      }

      const path = `/container/${container._id}/slot/${slotIndex}`;
      const slotTitle = getSlotTitle(+slotIndex, container.rows);

      await this.taskService.createUpdatePlantedTask(
        container,
        slot,
        plant,
        data,
        path,
        slotTitle,
      );
      await this.taskService.createUpdateTransplantedTask(
        container,
        slot,
        plant,
        data,
        path,
        slotTitle,
      );
    });
  }
}
