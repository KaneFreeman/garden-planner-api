import { BadRequestException, Inject, Injectable, NotFoundException, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
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
    userId: string,
    gardenId: string,
    options?: AddPlantInstanceOptions
  ): Promise<PlantInstanceDocument> {
    const { createTasks = true, copiedFromId } = options ?? {};

    const container = this.containerService.getContainer(createPlantInstanceDTO.containerId, userId, gardenId);
    if (!container) {
      throw new NotFoundException('Container does not exist!');
    }

    const newPlantInstance = await this.plantInstanceModel.create(sanitizePlantInstanceDTO(createPlantInstanceDTO));

    if (copiedFromId) {
      await this.taskService.copyTasks(copiedFromId, newPlantInstance._id.toString(), userId, gardenId);
    }

    await this.updateContainerAfterPlantInstanceUpdate(newPlantInstance, userId, gardenId);

    if (createTasks) {
      await this.createUpdatePlantInstanceTasks(newPlantInstance, userId, gardenId);
    }

    return newPlantInstance.save();
  }

  async findPlantInstances(
    userId: string,
    gardenId: string,
    extraPipeline: PipelineStage[] = []
  ): Promise<PlantInstanceDocument[]> {
    const plantInstances = await this.plantInstanceModel
      .aggregate<PlantInstanceDocument>([
        {
          $lookup: {
            from: 'containers',
            localField: 'containerId',
            foreignField: '_id',
            as: 'container'
          }
        },
        {
          $unwind: {
            path: '$container',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $match: {
            'container.gardenId': new Types.ObjectId(gardenId)
          }
        },
        {
          $lookup: {
            from: 'gardens',
            localField: 'container.gardenId',
            foreignField: '_id',
            as: 'garden'
          }
        },
        {
          $unwind: {
            path: '$garden',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $match: {
            'garden.userId': new Types.ObjectId(userId)
          }
        },
        ...extraPipeline,
        {
          $project: {
            _id: 1,
            containerId: 1,
            slotId: 1,
            subSlot: 1,
            plant: 1,
            created: 1,
            history: 1,
            startedFrom: 1,
            plantedCount: 1,
            pictures: 1,
            comments: 1,
            closed: 1,
            season: 1
          }
        }
      ])
      .exec();

    return plantInstances;
  }

  async getPlantInstance(
    plantInstanceId: string | null | undefined,
    userId: string,
    gardenId: string
  ): Promise<PlantInstanceDocument | null> {
    if (!plantInstanceId) {
      return null;
    }

    const plantInstance = await this.findPlantInstances(userId, gardenId, [
      {
        $match: {
          _id: new Types.ObjectId(plantInstanceId)
        }
      }
    ]);

    if (plantInstance.length === 0) {
      return null;
    }

    return plantInstance[0];
  }

  async getPlantInstances(userId: string, gardenId: string): Promise<PlantInstanceDocument[]> {
    return this.findPlantInstances(userId, gardenId);
  }

  async getPlantInstancesByPlant(plant: string, userId: string, gardenId: string): Promise<PlantInstanceDocument[]> {
    return this.findPlantInstances(userId, gardenId, [
      {
        $match: {
          plant: new Types.ObjectId(plant)
        }
      }
    ]);
  }

  async getPlantInstancesByContainer(
    containerId: string,
    userId: string,
    gardenId: string
  ): Promise<PlantInstanceDocument[]> {
    return this.findPlantInstances(userId, gardenId, [
      {
        $match: {
          containerId: new Types.ObjectId(containerId)
        }
      }
    ]);
  }

  async addPlantInstanceHistoryAndUpdateTask(
    plantInstanceId: string,
    userId: string,
    gardenId: string,
    historyStatus: HistoryStatus,
    taskType: TaskType,
    date: string
  ) {
    const plantInstance = await this.getPlantInstance(plantInstanceId, userId, gardenId);
    if (!plantInstance || !plantInstance._id) {
      throw new NotFoundException('Plant instance does not exist!');
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

    const task = await this.taskService.getOpenTaskByTypeAndPlantInstanceId(
      taskType,
      plantInstance._id,
      userId,
      gardenId
    );
    if (task) {
      await this.taskService.findByIdAndUpdate(task._id, userId, gardenId, {
        completedOn: new Date(date)
      });

      await this.createUpdatePlantInstanceTasks(updatePlantInstance, userId, gardenId);
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
    userId: string,
    gardenId: string,
    createPlantInstanceDTO: PlantInstanceDTO
  ): Promise<PlantInstanceDocument | null> {
    const plantInstance = this.getPlantInstance(plantInstanceId, userId, gardenId);
    if (!plantInstance) {
      throw new NotFoundException('Plant instance does not exist!');
    }

    createPlantInstanceDTO.history?.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const editedPlantInstance = await this.plantInstanceModel.findByIdAndUpdate(
      plantInstanceId,
      sanitizePlantInstanceDTO(createPlantInstanceDTO),
      { new: true }
    );

    await this.createUpdatePlantInstanceTasks(editedPlantInstance, userId, gardenId);
    await this.updateContainerAfterPlantInstanceUpdate(editedPlantInstance, userId, gardenId);

    return editedPlantInstance;
  }

  async closePlantInstance(
    plantInstanceId: string | undefined,
    userId: string,
    gardenId: string
  ): Promise<PlantInstanceDocument | null> {
    if (!plantInstanceId) {
      return Promise.resolve(null);
    }

    const plantInstance = this.getPlantInstance(plantInstanceId, userId, gardenId);
    if (!plantInstance) {
      throw new NotFoundException('Plant instance does not exist!');
    }

    const editedPlantInstance = await this.plantInstanceModel.findByIdAndUpdate(
      plantInstanceId,
      { closed: true },
      { new: true }
    );

    await this.createUpdatePlantInstanceTasks(editedPlantInstance, userId, gardenId);

    return editedPlantInstance;
  }

  async updateContainerAfterPlantInstanceUpdate(
    plantInstance: PlantInstanceDocument | null,
    userId: string,
    gardenId: string
  ) {
    if (plantInstance && !plantInstance.closed) {
      const container = await this.containerService.getContainer(plantInstance.containerId, userId, gardenId);
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
          userId,
          gardenId,
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

  async deletePlantInstance(
    plantInstanceId: string,
    userId: string,
    gardenId: string
  ): Promise<PlantInstanceDocument | null> {
    const plantInstance = await this.getPlantInstance(plantInstanceId, userId, gardenId);
    if (!plantInstance || !plantInstance._id) {
      throw new NotFoundException('Plant instance does not exist!');
    }

    if ((plantInstance.history ?? []).length > 0) {
      throw new BadRequestException('PlantInstance has history and cannot be deleted!');
    }

    const container = await this.containerService.getContainer(plantInstance.containerId, userId, gardenId);
    if (container && container._id) {
      const slot = container.slots?.get(`${plantInstance.slotId}`);
      const newSlots: Record<string, ContainerSlotDTO> = {};
      container.slots?.forEach((slot, key) => {
        newSlots[key] = slot.toObject<ContainerSlotDTO>();
      });

      newSlots[`${plantInstance.slotId}`] = {
        plantInstanceId: null,
        plantInstanceHistory: slot?.plantInstanceHistory,
        subSlot: slot?.subSlot
      };

      await this.containerService.editContainer(
        container._id,
        userId,
        gardenId,
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

    await this.plantInstanceModel.deleteOne({ _id: plantInstanceId });
    await this.taskService.deleteOpenTasksByPlantInstance(plantInstanceId, userId, gardenId);
    return plantInstance;
  }

  async createUpdateTasks(
    userId: string,
    gardenId: string,
    container: ContainerDocument,
    plantInstance: PlantInstanceDocument,
    path: string,
    slotTitle: string
  ) {
    const plant = await this.plantService.getPlant(plantInstance.plant, userId);
    const data = plant?.type ? plantData[plant.type] : undefined;

    const season = plantInstance.season ?? SPRING;

    await this.taskService.createUpdatePlantedTask(
      userId,
      gardenId,
      season,
      container,
      plantInstance,
      plant,
      data,
      path,
      slotTitle
    );

    await this.taskService.createUpdateTransplantedTask(
      userId,
      gardenId,
      season,
      container,
      plantInstance,
      plant,
      data,
      path,
      slotTitle
    );

    await this.taskService.createUpdateHarvestTask(
      userId,
      gardenId,
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
      userId,
      gardenId,
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

  async createUpdatePlantInstanceTasks(plantInstance: PlantInstanceDocument | null, userId: string, gardenId: string) {
    if (!plantInstance) {
      return;
    }

    const container = await this.containerService.getContainer(plantInstance.containerId, userId, gardenId);

    if (container) {
      const path = `/container/${container._id}/slot/${plantInstance.slotId}`;
      const slotTitle = getSlotTitle(plantInstance.slotId, container.rows);

      await this.createUpdateTasks(userId, gardenId, container, plantInstance, path, slotTitle);
    }
  }

  async bulkReopenClosePlantInstances(
    dto: BulkReopenClosePlantInstanceDTO,
    userId: string,
    gardenId: string
  ): Promise<PlantInstanceDocument[]> {
    const { action, plantInstanceIds } = sanitizeBulkReopenClosePlantInstanceDTO(dto) ?? {};
    if (!action || !plantInstanceIds || plantInstanceIds.length == 0) {
      return [];
    }

    const plantInstances: PlantInstanceDocument[] = [];
    for (const plantInstanceId of plantInstanceIds) {
      const plantInstance = await this.getPlantInstance(plantInstanceId, userId, gardenId);
      if (!plantInstance || plantInstance.closed !== (action === 'close')) {
        continue;
      }

      await this.plantInstanceModel.findByIdAndUpdate(plantInstanceId, { closed: action === 'close' }, { new: true });

      await this.createUpdatePlantInstanceTasks(plantInstance, userId, gardenId);

      if (plantInstance) {
        plantInstances.push(plantInstance);
      }
    }

    return plantInstances;
  }

  async findTransplantedOutsideHistoryByStatus(
    plantInstance: PlantInstanceDocument | undefined | null,
    userId: string,
    gardenId: string
  ): Promise<PlantInstanceHistoryDocument | null> {
    if (!plantInstance?.history) {
      return null;
    }

    for (const entry of plantInstance.history) {
      if (entry.status !== TRANSPLANTED) {
        continue;
      }

      const container = await this.containerService.getContainer(entry.to?.containerId, userId, gardenId);
      if (container?.type !== CONTAINER_TYPE_OUTSIDE) {
        continue;
      }

      return entry;
    }

    return null;
  }
}
