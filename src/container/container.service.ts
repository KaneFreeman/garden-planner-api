import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { TaskService } from '../task/task.service';
import { PlantService } from '../plant/plant.service';
import getSlotTitle from '../util/slot.util';
import { PlantInstanceService } from '../plant-instance/plant-instance.service';
import { ContainerDTO } from './dto/container.dto';
// import { ContainerFertilizeDTO } from './dto/container-fertilize.dto';
import { ContainerDocument } from './interfaces/container.interface';
import { BaseSlotDocument } from './interfaces/container-slot.interface';

@Injectable()
export class ContainerService {
  constructor(
    @InjectModel('Container')
    private readonly containerModel: Model<ContainerDocument>,
    @Inject(forwardRef(() => PlantService)) private plantService: PlantService,
    @Inject(forwardRef(() => TaskService)) private taskService: TaskService,
    @Inject(forwardRef(() => PlantInstanceService)) private plantInstanceService: PlantInstanceService
  ) {}

  async addContainer(createContainerDTO: ContainerDTO): Promise<ContainerDocument> {
    const newContainer = await this.containerModel.create(createContainerDTO);
    return newContainer.save();
  }

  async getContainer(containerId: string | null | undefined): Promise<ContainerDocument | null> {
    if (!containerId) {
      return null;
    }

    return this.containerModel.findById(containerId).exec();
  }

  async getContainers(): Promise<ContainerDocument[]> {
    return this.containerModel.find().exec();
  }

  async editContainer(
    containerId: string,
    createContainerDTO: Partial<ContainerDTO>
  ): Promise<ContainerDocument | null> {
    const editedContainer = await this.containerModel.findByIdAndUpdate(containerId, createContainerDTO, { new: true });

    if (editedContainer) {
      await this.createUpdatePlantTasks(editedContainer);
    }

    return editedContainer;
  }

  async deleteContainer(containerId: string): Promise<ContainerDocument | null> {
    return this.containerModel.findByIdAndRemove(containerId);
  }

  // async fertilizeContainer(containerId: string, data: ContainerFertilizeDTO): Promise<number> {
  //   const editedCount = await this.taskService.bulkEditTasks(
  //     { containerId, type: 'Fertilize', completedOn: null, start: { $lt: data.date } },
  //     { completedOn: data.date }
  //   );

  //   const container = await this.getContainer(containerId);
  //   await this.createUpdatePlantTasks(container);

  //   return editedCount;
  // }

  async createUpdatePlantTasksForSlot(
    container: ContainerDocument,
    slot: BaseSlotDocument,
    path: string,
    slotTitle: string
  ) {
    const plantInstance = await this.plantInstanceService.getPlantInstance(slot.plantInstanceId);
    if (plantInstance) {
      this.plantInstanceService.createUpdateTasks(container, plantInstance, path, slotTitle);
    }
  }

  async createUpdatePlantTasks(container: ContainerDocument | null | undefined) {
    if (!container?.slots) {
      return;
    }

    const { slots } = container;

    for (const [slotIndex, slot] of slots) {
      const path = `/container/${container._id}/slot/${slotIndex}`;
      const slotTitle = getSlotTitle(+slotIndex, container.rows);

      await this.createUpdatePlantTasksForSlot(container, slot, path, slotTitle);

      if (slot.subSlot) {
        await this.createUpdatePlantTasksForSlot(container, slot.subSlot, `${path}/sub-slot`, slotTitle);
      }
    }
  }
}
