import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { ContainerDTO } from './dto/container.dto';
import { ContainerDocument } from './interfaces/container.interface';
import { TaskService } from '../task/task.service';
import { PlantService } from '../plant/plant.service';
import plantData from '../data/plantData';
import getSlotTitle from '../util/slot.util';
import { BaseSlot, Slot } from '../interface';
import { BaseSlotDocument } from './interfaces/slot.interface';
import { ContainerFertilizeDTO } from './dto/container-fertilize.dto';

@Injectable()
export class ContainerService {
  constructor(
    @InjectModel('Container')
    private readonly containerModel: Model<ContainerDocument>,
    @Inject(forwardRef(() => PlantService)) private plantService: PlantService,
    private taskService: TaskService
  ) {}

  async addContainer(createContainerDTO: ContainerDTO): Promise<ContainerDocument> {
    const newContainer = await this.containerModel.create(createContainerDTO);
    return newContainer.save();
  }

  async getContainer(containerId: string): Promise<ContainerDocument | null> {
    return this.containerModel.findById(containerId).exec();
  }

  async getContainers(): Promise<ContainerDocument[]> {
    return this.containerModel.find().exec();
  }

  async editContainer(containerId: string, createContainerDTO: ContainerDTO): Promise<ContainerDocument | null> {
    const editedContainer = await this.containerModel.findByIdAndUpdate(containerId, createContainerDTO, { new: true });

    if (editedContainer) {
      await this.createUpdatePlantTasks(editedContainer);
      await this.updateTransplants(editedContainer);
    }

    return editedContainer;
  }

  async deleteContainer(containerId: string): Promise<ContainerDocument | null> {
    const deletedContainer = await this.containerModel.findByIdAndRemove(containerId);
    await this.taskService.deleteTasksByContainer(containerId);
    return deletedContainer;
  }

  async fertilizeContainer(containerId: string, data: ContainerFertilizeDTO): Promise<number> {
    return this.taskService.bulkEditTasks(
      { containerId, type: 'Fertilize', completedOn: null, start: { $lt: data.date } },
      { completedOn: data.date }
    );
  }

  async updateTransplants(container: ContainerDocument | undefined) {
    if (!container?.slots) {
      return;
    }

    const { slots } = container;

    for (const [slotIndex, slot] of slots) {
      await this.updateTransplantsForSlot(container, slotIndex, slot, false);

      if (slot.subSlot) {
        await this.updateTransplantsForSlot(container, slotIndex, slot.subSlot, true);
      }
    }
  }

  async updateTransplantsForSlot(
    container: ContainerDocument,
    slotIndex: string,
    slot: BaseSlotDocument,
    isSubSlot: boolean
  ) {
    if (!slot?.transplantedTo) {
      return;
    }

    const otherContainer = await this.getContainer(slot.transplantedTo.containerId);

    if (!otherContainer) {
      return;
    }

    const transplantedTo = `${slot.transplantedTo.slotId}`;

    const otherSlot = otherContainer.slots?.get(transplantedTo);
    if (otherContainer.slots && otherContainer.slots.has(transplantedTo)) {
      if (
        slot.transplantedTo.subSlot !== true &&
        ((otherSlot?.status ?? 'Not Planted') !== 'Not Planted' ||
          (otherSlot?.plant !== undefined && otherSlot?.plant !== slot.plant))
      ) {
        return;
      }

      if (
        slot.transplantedTo.subSlot === true &&
        ((otherSlot?.subSlot?.status ?? 'Not Planted') !== 'Not Planted' ||
          (otherSlot?.subSlot?.plant !== undefined && otherSlot?.subSlot?.plant !== slot.plant))
      ) {
        return;
      }
    }

    let newSlot: BaseSlot;
    if (slot.transplantedTo.subSlot === true) {
      newSlot = {
        ...(otherSlot?.subSlot?.toObject<Slot>() ?? {
          transplantedFrom: null,
          transplantedTo: null,
          startedFrom: 'Transplant'
        })
      };
    } else {
      newSlot = {
        ...(otherSlot?.toObject<Slot>() ?? {
          transplantedFrom: null,
          transplantedTo: null,
          startedFrom: 'Transplant'
        })
      };
    }

    newSlot.plant = slot.plant;
    console.log(slotIndex, slot.plant);
    newSlot.plantedDate = slot.plantedDate;
    newSlot.transplantedTo = null;
    newSlot.transplantedFromDate = slot.transplantedDate;
    newSlot.transplantedFrom = {
      containerId: container._id,
      slotId: +slotIndex,
      subSlot: isSubSlot
    };
    newSlot.plantedDate = slot.plantedDate;
    newSlot.status = 'Planted';

    const newSlots: Record<string, Slot> = {};
    otherContainer.slots?.forEach((slot, key) => {
      newSlots[key] = slot.toObject<Slot>();
    });

    if (slot.transplantedTo.subSlot === true) {
      newSlots[slot.transplantedTo.slotId] = {
        ...newSlots[slot.transplantedTo.slotId],
        subSlot: newSlot
      };
    } else {
      newSlots[slot.transplantedTo.slotId] = newSlot;
    }

    const editedContainer = await this.containerModel.findByIdAndUpdate(
      otherContainer._id,
      { slots: newSlots },
      { new: true }
    );

    if (editedContainer) {
      await this.createUpdatePlantTasks(editedContainer);
    }
  }

  async createUpdatePlantTasksForSlot(
    container: ContainerDocument,
    slot: BaseSlotDocument,
    path: string,
    slotTitle: string
  ) {
    const plant = await this.plantService.getPlant(slot.plant);
    const data = plant?.type ? plantData[plant.type] : undefined;

    await this.taskService.createUpdatePlantedTask('spring', container, slot, plant, data, path, slotTitle);

    if (container.type === 'Inside') {
      await this.taskService.createUpdateTransplantedTask('spring', container, slot, plant, data, path, slotTitle);
    } else {
      await this.taskService.createUpdateHarvestTask(container, slot, plant, path, slotTitle);
    }

    await this.taskService.createUpdateIndoorFertilzeTasksTask('spring', container, slot, plant, data, path, slotTitle);
  }

  async createUpdatePlantTasks(container: ContainerDocument | undefined) {
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
