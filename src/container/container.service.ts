import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { ContainerDTO } from './dto/container.dto';
import { ContainerDocument } from './interfaces/container.interface';
import { TaskService } from '../task/task.service';
import { PlantService } from '../plant/plant.service';
import plantData from '../data/plantData';
import getSlotTitle from '../util/slot.util';
import { Slot } from '../interface';
import { BaseSlotDocument } from './interfaces/slot.interface';

@Injectable()
export class ContainerService {
  constructor(
    @InjectModel('Container')
    private readonly containerModel: Model<ContainerDocument>,
    private plantService: PlantService,
    private taskService: TaskService,
  ) {}

  async addContainer(
    createContainerDTO: ContainerDTO,
  ): Promise<ContainerDocument> {
    const newContainer = await this.containerModel.create(createContainerDTO);
    return newContainer.save();
  }

  async getContainer(containerId): Promise<ContainerDocument> {
    const container = await this.containerModel.findById(containerId).exec();
    return container;
  }

  async getContainers(): Promise<ContainerDocument[]> {
    const containers = await this.containerModel.find().exec();
    return containers;
  }

  async editContainer(
    containerId,
    createContainerDTO: ContainerDTO,
  ): Promise<ContainerDocument> {
    const editedContainer = await this.containerModel.findByIdAndUpdate(
      containerId,
      createContainerDTO,
      { new: true },
    );
    await this.createUpdatePlantTasks(editedContainer);
    await this.updateTransplants(editedContainer);
    return editedContainer;
  }

  async deleteContainer(containerId): Promise<ContainerDocument> {
    const deletedContainer = await this.containerModel.findByIdAndRemove(
      containerId,
    );
    return deletedContainer;
  }

  async updateTransplants(container: ContainerDocument | undefined) {
    if (!container?.slots) {
      return;
    }

    const { slots } = container;

    for (const [slotIndex, slot] of slots) {
      if (!slot?.transplantedTo) {
        continue;
      }

      const otherContainer = await this.getContainer(
        slot.transplantedTo.containerId,
      );

      if (!otherContainer) {
        continue;
      }

      const transplantedTo = `${slot.transplantedTo.slotId}`;

      let newSlot: Slot;
      if (otherContainer.slots && otherContainer.slots.has(transplantedTo)) {
        const otherSlot = otherContainer.slots.get(transplantedTo);
        if (
          otherSlot.status !== 'Not Planted' ||
          otherSlot.plant !== slot.plant
        ) {
          continue;
        }

        newSlot = { ...otherSlot.toObject<Slot>() };
        newSlot.transplantedFrom = {
          containerId: container._id,
          slotId: +slotIndex,
        };
        newSlot.plantedDate = slot.plantedDate;
        newSlot.status = 'Planted';
      } else {
        newSlot = { ...slot.toObject<Slot>() };
        delete newSlot.transplantedTo;
        newSlot.transplantedFrom = {
          containerId: container._id,
          slotId: +slotIndex,
        };
        newSlot.status = 'Planted';
      }

      const newSlots: Record<string, Slot> = {};
      otherContainer.slots?.forEach((slot, key) => {
        newSlots[key] = slot.toObject<Slot>();
      });
      newSlots[slot.transplantedTo.slotId] = newSlot;

      const editedContainer = await this.containerModel.findByIdAndUpdate(
        otherContainer._id,
        { slots: newSlots },
        { new: true },
      );

      await this.createUpdatePlantTasks(editedContainer);
    }
  }

  async createUpdatePlantTasksForSlot(
    container: ContainerDocument,
    slot: BaseSlotDocument,
    path: string,
    slotTitle: string,
  ) {
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

    await this.taskService.createUpdatePlantedTask(
      'spring',
      container,
      slot,
      plant,
      data,
      path,
      slotTitle,
    );

    if (container.type === 'Inside') {
      await this.taskService.createUpdateTransplantedTask(
        container,
        slot,
        plant,
        data,
        path,
        slotTitle,
      );
    } else {
      await this.taskService.createUpdateHarvestTask(
        container,
        slot,
        plant,
        path,
        slotTitle,
      );
    }
  }

  async createUpdatePlantTasks(container: ContainerDocument | undefined) {
    if (!container?.slots) {
      return;
    }

    const { slots } = container;

    for (const [slotIndex, slot] of slots) {
      const path = `/container/${container._id}/slot/${slotIndex}`;
      const slotTitle = getSlotTitle(+slotIndex, container.rows);

      await this.createUpdatePlantTasksForSlot(
        container,
        slot,
        path,
        slotTitle,
      );

      if (slot.subSlot) {
        await this.createUpdatePlantTasksForSlot(
          container,
          slot.subSlot,
          `${path}/sub-slot`,
          slotTitle,
        );
      }
    }
  }
}
