import { BadRequestException, Inject, Injectable, NotFoundException, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ContainerService } from '../container/container.service';
import { ContainerSlotDTO } from '../container/dto/container-slot.dto';
import { ContainerDocument } from '../container/interfaces/container.interface';
import plantData from '../data/plantData';
import { CONTAINER_TYPE_OUTSIDE, HistoryStatus, SPRING, TRANSPLANTED, TaskType } from '../interface';
import { PlantService } from '../plant/plant.service';
import { TaskService } from '../task/task.service';
import { isNullish } from '../util/null.util';
import getSlotTitle from '../util/slot.util';
import {
  BulkReopenClosePlantInstanceDTO,
  sanitizeBulkReopenClosePlantInstanceDTO
} from './dto/bulk-reopen-close-plant-instance.dto';
import { PlantInstanceHistoryDto } from './dto/plant-instance-history.dto';
import { PlantInstanceDTO, sanitizePlantInstanceDTO } from './dto/plant-instance.dto';
import { PlantInstanceHistoryDocument } from './interfaces/plant-instance-history.interface';
import { PlantInstanceDocument } from './interfaces/plant-instance.interface';

interface AddPlantInstanceOptions {
  createTasks?: boolean;
  copiedFromId?: string;
}

@Injectable()
export class PlantInstanceService {
  constructor(
    @InjectModel('PlantInstance')
    private readonly plantInstanceModel: Model<PlantInstanceDocument>,
    @Inject(forwardRef(() => PlantService)) private plantService: PlantService,
    @Inject(forwardRef(() => TaskService)) private taskService: TaskService,
    @Inject(forwardRef(() => ContainerService)) private containerService: ContainerService
  ) {}

  async addPlantInstance(
    createPlantInstanceDTO: PlantInstanceDTO,
    options?: AddPlantInstanceOptions
  ): Promise<PlantInstanceDocument> {
    const { createTasks = true, copiedFromId } = options ?? {};

    const newPlantInstance = await this.plantInstanceModel.create(sanitizePlantInstanceDTO(createPlantInstanceDTO));

    if (copiedFromId) {
      await this.taskService.copyTasks(copiedFromId, newPlantInstance._id.toString());
    }

    await this.updateContainerAfterPlantInstanceUpdate(newPlantInstance);

    if (createTasks) {
      await this.createUpdatePlantInstanceTasks(newPlantInstance);
    }

    return newPlantInstance.save();
  }

  async getPlantInstance(plantInstanceId: string | undefined | null): Promise<PlantInstanceDocument | null> {
    if (isNullish(plantInstanceId)) {
      return null;
    }
    return this.plantInstanceModel.findById(plantInstanceId).exec();
  }

  async getPlantInstances(): Promise<PlantInstanceDocument[]> {
    return this.plantInstanceModel.find().exec();
  }

  async getPlantInstancesByPlant(plant: string): Promise<PlantInstanceDocument[]> {
    return this.plantInstanceModel.find({ plant }).exec();
  }

  async getPlantInstancesByContainer(containerId: string): Promise<PlantInstanceDocument[]> {
    return this.plantInstanceModel.find({ containerId }).exec();
  }

  async addPlantInstanceHistoryAndUpdateTask(
    plantInstanceId: string,
    historyStatus: HistoryStatus,
    taskType: TaskType,
    date: string
  ) {
    const plantInstance = await this.getPlantInstance(plantInstanceId);
    if (!plantInstance || !plantInstance._id) {
      throw new NotFoundException('PlantInstance does not exist!');
    }

    if (!date) {
      throw new BadRequestException('Invalid date!');
    }

    const updatePlantInstance = await this.addPlantInstanceHistory(plantInstance, {
      status: historyStatus,
      date,
      from: {
        containerId: plantInstance.containerId,
        slotId: plantInstance.slotId,
        subSlot: plantInstance.subSlot
      }
    });

    const task = await this.taskService.getOpenTaskByTypeAndPlantInstanceId(taskType, plantInstance._id);
    if (task) {
      await this.taskService.findByIdAndUpdate(task._id, {
        completedOn: new Date(date)
      });

      await this.createUpdatePlantInstanceTasks(updatePlantInstance);
    }

    return updatePlantInstance;
  }

  async addPlantInstanceHistory(
    plantInstance: PlantInstanceDocument | null,
    history: PlantInstanceHistoryDto
  ): Promise<PlantInstanceDocument | null> {
    if (!plantInstance) {
      return null;
    }

    return this.plantInstanceModel
      .findByIdAndUpdate(
        plantInstance._id,
        {
          history: [...(plantInstance.history ?? []), history].sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
          )
        },
        { new: true }
      )
      .exec();
  }

  async editPlantInstance(
    plantInstanceId: string,
    createPlantInstanceDTO: PlantInstanceDTO
  ): Promise<PlantInstanceDocument | null> {
    createPlantInstanceDTO.history?.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const editedPlantInstance = await this.plantInstanceModel.findByIdAndUpdate(
      plantInstanceId,
      sanitizePlantInstanceDTO(createPlantInstanceDTO),
      { new: true }
    );

    await this.createUpdatePlantInstanceTasks(editedPlantInstance);
    await this.updateContainerAfterPlantInstanceUpdate(editedPlantInstance);

    return editedPlantInstance;
  }

  async closePlantInstance(plantInstanceId?: string): Promise<PlantInstanceDocument | null> {
    if (!plantInstanceId) {
      return Promise.resolve(null);
    }

    const editedPlantInstance = await this.plantInstanceModel.findByIdAndUpdate(
      plantInstanceId,
      { closed: true },
      { new: true }
    );

    await this.createUpdatePlantInstanceTasks(editedPlantInstance);

    return editedPlantInstance;
  }

  async updateContainerAfterPlantInstanceUpdate(plantInstance: PlantInstanceDocument | null) {
    if (plantInstance && !plantInstance.closed) {
      const container = await this.containerService.getContainer(plantInstance.containerId);
      if (container && container._id) {
        const slot = container.slots?.get(`${plantInstance.slotId}`);
        const newSlots: Record<string, ContainerSlotDTO> = {};
        container.slots?.forEach((slot, key) => {
          newSlots[key] = slot.toObject<ContainerSlotDTO>();
        });

        if (plantInstance.subSlot) {
          const subSlot = slot?.subSlot;

          if (!subSlot || isNullish(subSlot.plantInstanceId)) {
            newSlots[`${plantInstance.slotId}`] = {
              ...newSlots[`${plantInstance.slotId}`],
              subSlot: {
                plantInstanceId: plantInstance._id?.toString(),
                plantInstanceHistory: subSlot?.plantInstanceHistory
              }
            };
          }
        } else {
          newSlots[`${plantInstance.slotId}`] = {
            plantInstanceId: plantInstance._id?.toString(),
            plantInstanceHistory: slot?.plantInstanceHistory,
            subSlot: slot?.subSlot
          };
        }

        await this.containerService.editContainer(
          container._id,
          {
            name: container.name,
            type: container.type,
            rows: container.rows,
            columns: container.columns,
            slots: newSlots
          },
          false
        );
      }
    }
  }

  async deletePlantInstance(plantInstanceId: string): Promise<PlantInstanceDocument | null> {
    const deletedPlantInstance = await this.plantInstanceModel.findByIdAndRemove(plantInstanceId);
    await this.taskService.deleteOpenTasksByPlantInstance(plantInstanceId);
    return deletedPlantInstance;
  }

  async createUpdateTasks(
    container: ContainerDocument,
    plantInstance: PlantInstanceDocument,
    path: string,
    slotTitle: string
  ) {
    const plant = await this.plantService.getPlant(plantInstance.plant);
    const data = plant?.type ? plantData[plant.type] : undefined;

    const season = plantInstance.season ?? SPRING;

    await this.taskService.createUpdatePlantedTask(season, container, plantInstance, plant, data, path, slotTitle);

    await this.taskService.createUpdateTransplantedTask(season, container, plantInstance, plant, data, path, slotTitle);

    await this.taskService.createUpdateHarvestTask(
      season,
      container,
      plantInstance.slotId,
      plantInstance.subSlot ?? false,
      plantInstance,
      plant,
      data,
      path,
      slotTitle
    );

    await this.taskService.createUpdateFertilzeTasks(
      season,
      container,
      plantInstance.slotId,
      plantInstance.subSlot ?? false,
      plantInstance,
      plant,
      data,
      path,
      slotTitle
    );
  }

  async createUpdatePlantInstanceTasks(plantInstance: PlantInstanceDocument | null) {
    if (!plantInstance) {
      return;
    }

    const container = await this.containerService.getContainer(plantInstance.containerId);

    if (container) {
      const path = `/container/${container._id}/slot/${plantInstance.slotId}`;
      const slotTitle = getSlotTitle(plantInstance.slotId, container.rows);

      await this.createUpdateTasks(container, plantInstance, path, slotTitle);
    }
  }

  async bulkReopenClosePlantInstances(dto: BulkReopenClosePlantInstanceDTO): Promise<PlantInstanceDocument[]> {
    const { action, plantInstanceIds } = sanitizeBulkReopenClosePlantInstanceDTO(dto) ?? {};
    if (!action || !plantInstanceIds || plantInstanceIds.length == 0) {
      return [];
    }

    const plantInstances: PlantInstanceDocument[] = [];
    for (const plantInstanceId of plantInstanceIds) {
      const plantInstance = await this.plantInstanceModel.findByIdAndUpdate(
        plantInstanceId,
        { closed: action === 'close' },
        { new: true }
      );

      await this.createUpdatePlantInstanceTasks(plantInstance);

      if (plantInstance) {
        plantInstances.push(plantInstance);
      }
    }

    return plantInstances;
  }

  async findTransplantedOutsideHistoryByStatus(
    plantInstance: PlantInstanceDocument | undefined | null
  ): Promise<PlantInstanceHistoryDocument | null> {
    if (!plantInstance?.history) {
      return null;
    }

    for (const entry of plantInstance.history) {
      if (entry.status !== TRANSPLANTED) {
        continue;
      }

      const container = await this.containerService.getContainer(entry.to?.containerId);
      if (container?.type !== CONTAINER_TYPE_OUTSIDE) {
        continue;
      }

      return entry;
    }

    return null;
  }
}
