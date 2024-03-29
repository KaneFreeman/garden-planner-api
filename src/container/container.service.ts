import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TaskType } from '../interface';
import { PlantInstanceService } from '../plant-instance/plant-instance.service';
import { PlantService } from '../plant/plant.service';
import { TaskService } from '../task/task.service';
import { fromTaskTypeToHistoryStatus } from '../util/history.util';
import { isNotNullish } from '../util/null.util';
import getSlotTitle from '../util/slot.util';
import { ContainerSlotDTO } from './dto/container-slot.dto';
import { ContainerDTO, sanitizeContainerDTO } from './dto/container.dto';
import { BaseSlotDocument } from './interfaces/container-slot.interface';
import { ContainerDocument } from './interfaces/container.interface';

@Injectable()
export class ContainerService {
  constructor(
    @InjectModel('Container')
    private readonly containerModel: Model<ContainerDocument>,
    @Inject(forwardRef(() => PlantService)) private plantService: PlantService,
    @Inject(forwardRef(() => TaskService)) private taskService: TaskService,
    @Inject(forwardRef(() => PlantInstanceService)) private plantInstanceService: PlantInstanceService
  ) {}

  async addContainer(containerDTO: ContainerDTO): Promise<ContainerDocument> {
    const newContainer = await this.containerModel.create(sanitizeContainerDTO(containerDTO));
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
    containerDTO: ContainerDTO,
    updateTasks: boolean
  ): Promise<ContainerDocument | null> {
    const sanitizedContainerDTO = sanitizeContainerDTO(containerDTO);
    if (!sanitizedContainerDTO) {
      return null;
    }

    const oldContainer = await this.getContainer(containerId);
    if (!oldContainer) {
      return null;
    }

    let newContainerDTO = sanitizedContainerDTO;

    const oldSlots = oldContainer?.slots;
    if (oldSlots) {
      const slots = sanitizedContainerDTO?.slots ?? {};

      newContainerDTO = {
        ...sanitizedContainerDTO,
        slots: Object.keys(slots).reduce((accumlatedSlots, slotIndex) => {
          // TODO FIX THIS
          const oldSlot = oldSlots.get(slotIndex);
          const slot = slots[slotIndex];

          const newSlot: ContainerSlotDTO = isNotNullish(slot)
            ? {
                ...slot,
                plant: slot.plantInstanceId ? null : slot.plant
              }
            : {};

          if (isNotNullish(oldSlot)) {
            if (
              isNotNullish(newSlot) &&
              isNotNullish(oldSlot.plantInstanceId) &&
              `${oldSlot.plantInstanceId}` !== newSlot.plantInstanceId
            ) {
              accumlatedSlots[slotIndex] = {
                ...newSlot,
                plantInstanceHistory: [...(newSlot.plantInstanceHistory ?? []), `${oldSlot.plantInstanceId}`]
              };
            } else {
              accumlatedSlots[slotIndex] = newSlot;
            }
          } else {
            accumlatedSlots[slotIndex] = newSlot;
          }

          return slots;
        }, {} as Record<string, ContainerSlotDTO>)
      };
    }

    const editedContainer = await this.containerModel.findByIdAndUpdate(containerId, newContainerDTO, { new: true });

    if (editedContainer && updateTasks) {
      await this.createUpdatePlantTasks(editedContainer);
    }

    return editedContainer;
  }

  async deleteContainer(containerId: string): Promise<ContainerDocument | null> {
    const result = this.containerModel.findByIdAndRemove(containerId);

    const plantInstances = await this.plantInstanceService.getPlantInstancesByContainer(containerId);
    for (const plantInstance of plantInstances) {
      await this.plantInstanceService.closePlantInstance(plantInstance._id);
    }

    return result;
  }

  async updateContainerTasksByType(
    containerId: string,
    date: string,
    type: TaskType,
    plantInstanceIds?: string[]
  ): Promise<number> {
    const tasks = await this.taskService.getTasks({ type, completedOn: null, start: { $lte: date } });

    let updatedCount = 0;

    for (const task of tasks) {
      const plantInstance = await this.plantInstanceService.getPlantInstance(task.plantInstanceId);
      if (
        plantInstance &&
        plantInstance.containerId === containerId &&
        (!plantInstanceIds || (plantInstance._id && plantInstanceIds.includes(plantInstance._id.toString())))
      ) {
        const updatedTask = await this.taskService.findByIdAndUpdate(task._id, { completedOn: date });
        updatedCount++;

        if (task?.type === type && updatedTask?.completedOn) {
          const updatedPlantInstance = await this.plantInstanceService.addPlantInstanceHistory(plantInstance, {
            status: fromTaskTypeToHistoryStatus(type),
            date: updatedTask.completedOn.toISOString(),
            from: {
              containerId: plantInstance.containerId,
              slotId: plantInstance.slotId,
              subSlot: plantInstance.subSlot
            }
          });
          await this.plantInstanceService.createUpdatePlantInstanceTasks(updatedPlantInstance);
        }
      }
    }

    return updatedCount;
  }

  async createUpdatePlantTasksForSlot(
    container: ContainerDocument,
    slot: BaseSlotDocument,
    path: string,
    slotTitle: string,
    plantId?: string
  ) {
    const plantInstance = await this.plantInstanceService.getPlantInstance(slot.plantInstanceId);
    if (plantInstance && (!plantId || plantInstance.plant === plantId)) {
      this.plantInstanceService.createUpdateTasks(container, plantInstance, path, slotTitle);
    }
  }

  async createUpdatePlantTasks(container: ContainerDocument | null | undefined, plantId?: string) {
    if (!container?.slots) {
      return;
    }

    const { slots } = container;

    for (const [slotIndex, slot] of slots) {
      const path = `/container/${container._id}/slot/${slotIndex}`;
      const slotTitle = getSlotTitle(+slotIndex, container.rows);

      await this.createUpdatePlantTasksForSlot(container, slot, path, slotTitle, plantId);

      if (slot.subSlot) {
        await this.createUpdatePlantTasksForSlot(container, slot.subSlot, `${path}/sub-slot`, slotTitle, plantId);
      }
    }
  }
}
