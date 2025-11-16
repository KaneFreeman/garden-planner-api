import { BadRequestException, Inject, Injectable, Logger, NotFoundException, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isAfter, isBefore, parseISO } from 'date-fns';
import { Model, PipelineStage, Types } from 'mongoose';
import { ContainerService } from '../container/container.service';
import { ContainerSlotDTO } from '../container/dto/container-slot.dto';
import { ContainerProjection } from '../container/interfaces/container.projection';
import plantData from '../data/plantData';
import {
  CONTAINER_TYPE_OUTSIDE,
  FALL,
  GrowingZoneData,
  HistoryStatus,
  PLANTED,
  SPRING,
  TRANSPLANTED,
  TaskType
} from '../interface';
import { PlantService } from '../plant/plant.service';
import { TaskService } from '../task/services/task.service';
import { UserService } from '../users/user.service';
import {
  BulkReopenClosePlantInstanceDTO,
  sanitizeBulkReopenClosePlantInstanceDTO
} from './dto/bulk-reopen-close-plant-instance.dto';
import { PlantInstanceHistoryDto } from './dto/plant-instance-history.dto';
import { PlantInstanceDTO, sanitizePlantInstanceDTO } from './dto/plant-instance.dto';
import { PlantInstanceHistoryDocument } from './interfaces/plant-instance-history.document';
import { PlantInstanceDocument } from './interfaces/plant-instance.document';
import { PlantInstanceProjection } from './interfaces/plant-instance.projection';

interface AddPlantInstanceOptions {
  createTasks?: boolean;
  copiedFromId?: string;
}

@Injectable()
export class PlantInstanceService {
  constructor(
    @InjectModel('PlantInstance')
    private readonly plantInstanceModel: Model<PlantInstanceDocument>,
    private logger: Logger,
    @Inject(forwardRef(() => PlantService)) private plantService: PlantService,
    @Inject(forwardRef(() => TaskService)) private taskService: TaskService,
    @Inject(forwardRef(() => ContainerService)) private containerService: ContainerService,
    @Inject(forwardRef(() => UserService)) private userService: UserService
  ) {}

  async addPlantInstance(
    createPlantInstanceDTO: PlantInstanceDTO,
    userId: string,
    gardenId: string,
    options?: AddPlantInstanceOptions
  ): Promise<PlantInstanceProjection> {
    const { createTasks = true, copiedFromId } = options ?? {};

    const sanitizedPlantInstanceDTO = sanitizePlantInstanceDTO(createPlantInstanceDTO);
    const container = this.containerService.getContainer(sanitizedPlantInstanceDTO.containerId, userId, gardenId);
    if (!container) {
      throw new NotFoundException('Container does not exist!');
    }

    const newPlantInstance = await this.plantInstanceModel.create({
      ...sanitizedPlantInstanceDTO,
      containerId: new Types.ObjectId(sanitizedPlantInstanceDTO.containerId)
    });

    if (copiedFromId) {
      await this.taskService.copyTasks(copiedFromId, newPlantInstance._id.toString(), userId, gardenId);
    }

    await this.updateContainerAfterPlantInstanceUpdate(newPlantInstance, userId, gardenId);

    if (createTasks) {
      const growingZoneData = await this.userService.getGrowingZoneData(userId);
      if (growingZoneData) {
        await this.createUpdatePlantInstanceTasks(newPlantInstance, userId, gardenId, growingZoneData);
      }
    }

    return newPlantInstance.save();
  }

  async findPlantInstances(
    userId: string,
    gardenId: string,
    extraPipeline: PipelineStage[] = []
  ): Promise<PlantInstanceProjection[]> {
    const plantInstances = await this.plantInstanceModel
      .aggregate<PlantInstanceProjection>([
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
            plant: 1,
            created: 1,
            history: 1,
            startedFrom: 1,
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
  ): Promise<PlantInstanceProjection | null> {
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

  async getPlantInstances(userId: string, gardenId: string): Promise<PlantInstanceProjection[]> {
    return this.findPlantInstances(userId, gardenId);
  }

  async getPlantInstancesByPlant(plant: string, userId: string, gardenId: string): Promise<PlantInstanceProjection[]> {
    return this.findPlantInstances(userId, gardenId, [
      {
        $match: {
          plant: new Types.ObjectId(plant)
        }
      }
    ]);
  }

  async getPlantInstancesByContainerAndIdIn(
    containerId: string,
    plantInstanceIds: string[],
    userId: string,
    gardenId: string
  ): Promise<PlantInstanceProjection[]> {
    return this.findPlantInstances(userId, gardenId, [
      {
        $match: {
          containerId: new Types.ObjectId(containerId),
          _id: {
            $in: plantInstanceIds.map((id) => new Types.ObjectId(id))
          }
        }
      }
    ]);
  }

  async getPlantInstancesByContainer(
    containerId: string,
    userId: string,
    gardenId: string
  ): Promise<PlantInstanceProjection[]> {
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
        slotId: plantInstance.slotId
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

      const growingZoneData = await this.userService.getGrowingZoneData(userId);
      if (growingZoneData) {
        await this.createUpdatePlantInstanceTasks(updatePlantInstance, userId, gardenId, growingZoneData);
      }
    }

    return updatePlantInstance;
  }

  async addPlantInstanceHistory(
    plantInstance: PlantInstanceProjection | null,
    history: PlantInstanceHistoryDto
  ): Promise<PlantInstanceProjection | null> {
    if (!plantInstance) {
      return null;
    }

    let season = plantInstance.season;
    const historyDate = parseISO(history.date);
    if (history.status === PLANTED) {
      if (season === SPRING) {
        const fallCutoffDate = new Date();
        fallCutoffDate.setFullYear(historyDate.getFullYear(), 6, 31); // July 31st
        if (isAfter(historyDate, fallCutoffDate)) {
          season = FALL;
        }
      } else if (season === FALL) {
        const springCutoffDate = new Date();
        springCutoffDate.setFullYear(historyDate.getFullYear(), 5, 1); // June 1st
        if (isBefore(historyDate, springCutoffDate)) {
          season = SPRING;
        }
      }
    }

    return this.plantInstanceModel
      .findByIdAndUpdate(
        plantInstance._id,
        {
          season,
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
  ): Promise<PlantInstanceProjection | null> {
    const sanitizedPlantInstanceDTO = sanitizePlantInstanceDTO(createPlantInstanceDTO);

    const plantInstance = this.getPlantInstance(plantInstanceId, userId, gardenId);
    if (!plantInstance) {
      throw new NotFoundException('Plant instance does not exist!');
    }

    sanitizedPlantInstanceDTO.history?.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const editedPlantInstance = await this.plantInstanceModel.findByIdAndUpdate(
      plantInstanceId,
      {
        ...sanitizedPlantInstanceDTO,
        containerId: new Types.ObjectId(sanitizedPlantInstanceDTO.containerId)
      },
      { new: true }
    );

    const growingZoneData = await this.userService.getGrowingZoneData(userId);
    if (growingZoneData) {
      await this.createUpdatePlantInstanceTasks(editedPlantInstance, userId, gardenId, growingZoneData);
    }

    await this.updateContainerAfterPlantInstanceUpdate(editedPlantInstance, userId, gardenId);

    return editedPlantInstance;
  }

  async closePlantInstance(
    plantInstanceId: string | undefined,
    userId: string,
    gardenId: string,
    growingZoneData: GrowingZoneData | undefined
  ): Promise<PlantInstanceProjection | null> {
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

    await this.createUpdatePlantInstanceTasks(editedPlantInstance, userId, gardenId, growingZoneData);

    return editedPlantInstance;
  }

  async updateContainerAfterPlantInstanceUpdate(
    plantInstance: PlantInstanceProjection | null,
    userId: string,
    gardenId: string
  ) {
    if (plantInstance && !plantInstance.closed) {
      const container = await this.containerService.getContainer(plantInstance.containerId, userId, gardenId);
      if (container && container._id) {
        const slot = container.slots?.[`${plantInstance.slotId}`];
        const newSlots: Record<string, ContainerSlotDTO> = {};

        const oldSlots = container.slots ?? {};
        Object.keys(oldSlots).forEach((key) => {
          newSlots[key] = { ...oldSlots[key] };
        });

        newSlots[`${plantInstance.slotId}`] = {
          plantInstanceId: plantInstance._id?.toString(),
          plantInstanceHistory: slot?.plantInstanceHistory
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
    }
  }

  async deletePlantInstance(
    plantInstanceId: string,
    userId: string,
    gardenId: string
  ): Promise<PlantInstanceProjection | null> {
    const plantInstance = await this.getPlantInstance(plantInstanceId, userId, gardenId);
    if (!plantInstance || !plantInstance._id) {
      throw new NotFoundException('Plant instance does not exist!');
    }

    if ((plantInstance.history ?? []).length > 0) {
      throw new BadRequestException('PlantInstance has history and cannot be deleted!');
    }

    const container = await this.containerService.getContainer(plantInstance.containerId, userId, gardenId);
    if (container && container._id) {
      const slot = container.slots?.[`${plantInstance.slotId}`];
      const newSlots: Record<string, ContainerSlotDTO> = {};

      const oldSlots = container.slots ?? {};
      Object.keys(oldSlots).forEach((key) => {
        newSlots[key] = { ...oldSlots[key] };
      });

      newSlots[`${plantInstance.slotId}`] = {
        plantInstanceId: null,
        plantInstanceHistory: slot?.plantInstanceHistory
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
    container: ContainerProjection,
    plantInstance: PlantInstanceProjection,
    path: string,
    growingZoneData: GrowingZoneData
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
      growingZoneData,
      path
    );

    await this.taskService.createUpdateTransplantedTask(
      userId,
      gardenId,
      season,
      container,
      plantInstance,
      plant,
      data,
      growingZoneData,
      path
    );

    await this.taskService.createUpdateHarvestTask(
      userId,
      gardenId,
      season,
      container,
      plantInstance.slotId,
      plantInstance,
      plant,
      data,
      path
    );

    await this.taskService.createUpdateFertilzeTasks(
      userId,
      gardenId,
      season,
      container,
      plantInstance.slotId,
      plantInstance,
      plant,
      data,
      path
    );
  }

  async createUpdatePlantInstanceTasks(
    plantInstance: PlantInstanceProjection | null,
    userId: string,
    gardenId: string,
    growingZoneData: GrowingZoneData | undefined
  ) {
    if (!plantInstance || !growingZoneData) {
      return;
    }

    const container = await this.containerService.getContainer(plantInstance.containerId, userId, gardenId);

    if (container) {
      await this.createUpdateTasks(
        userId,
        gardenId,
        container,
        plantInstance,
        `/container/${container._id}`,
        growingZoneData
      );
    }
  }

  async bulkReopenClosePlantInstances(
    dto: BulkReopenClosePlantInstanceDTO,
    userId: string,
    gardenId: string
  ): Promise<PlantInstanceProjection[]> {
    const { action, plantInstanceIds } = sanitizeBulkReopenClosePlantInstanceDTO(dto) ?? {};
    if (!action || !plantInstanceIds || plantInstanceIds.length == 0) {
      return [];
    }

    const growingZoneData = await this.userService.getGrowingZoneData(userId);

    const plantInstances: PlantInstanceProjection[] = [];
    for (const plantInstanceId of plantInstanceIds) {
      let plantInstance = await this.getPlantInstance(plantInstanceId, userId, gardenId);
      if (!plantInstance || plantInstance.closed === (action === 'close')) {
        continue;
      }

      plantInstance = await this.plantInstanceModel.findByIdAndUpdate(
        plantInstanceId,
        { closed: action === 'close' },
        { new: true }
      );

      if (growingZoneData) {
        await this.createUpdatePlantInstanceTasks(plantInstance, userId, gardenId, growingZoneData);
      }

      if (plantInstance) {
        plantInstances.push(plantInstance);
      }
    }

    return plantInstances;
  }

  async findTransplantedOutsideHistoryByStatus(
    plantInstance: PlantInstanceProjection | undefined | null,
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
