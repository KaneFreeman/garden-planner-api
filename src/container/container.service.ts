import { forwardRef, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
import { GardenService } from '../garden/garden.service';
import { GrowingZoneData, STARTED_FROM_TYPE_SEED, TaskType } from '../interface';
import { PlantInstanceService } from '../plant-instance/plant-instance.service';
import { RealtimePublisher } from '../realtime/realtime.publisher';
import { TaskProjection } from '../task/interfaces/task.projection';
import { TaskService } from '../task/services/task.service';
import { UserService } from '../users/user.service';
import { fromTaskTypeToHistoryStatus } from '../util/history.util';
import { isNotNullish } from '../util/null.util';
import computeSeason from '../util/season.util';
import { ContainerSlotDTO } from './dto/container-slot.dto';
import { ContainerDTO, sanitizeContainerDTO } from './dto/container.dto';
import { Slot } from './interfaces/container-slot.interface';
import { ContainerDocument } from './interfaces/container.document';
import { ContainerProjection } from './interfaces/container.projection';

@Injectable()
export class ContainerService {
  constructor(
    @InjectModel('Container')
    private readonly containerModel: Model<ContainerDocument>,
    private logger: Logger,
    @Inject(forwardRef(() => TaskService)) private taskService: TaskService,
    @Inject(forwardRef(() => GardenService)) private gardenService: GardenService,
    @Inject(forwardRef(() => PlantInstanceService)) private plantInstanceService: PlantInstanceService,
    @Inject(forwardRef(() => UserService)) private userService: UserService,
    private readonly realtimePublisher: RealtimePublisher
  ) {}

  async addContainer(containerDTO: ContainerDTO, userId: string, gardenId: string): Promise<ContainerProjection> {
    const garden = await this.gardenService.getGarden(gardenId, userId);
    if (!garden) {
      throw new NotFoundException('Garden does not exist!');
    }

    const newContainer = await this.containerModel.create({
      ...sanitizeContainerDTO(containerDTO),
      gardenId
    });
    const savedContainer = await newContainer.save();
    await this.publishGardenSync(userId, gardenId, 'container.added');
    return savedContainer;
  }

  async getContainers(
    userId: string,
    gardenId: string,
    extraPipeline: PipelineStage[] = []
  ): Promise<ContainerProjection[]> {
    const containers = await this.containerModel
      .aggregate<ContainerProjection>([
        {
          $lookup: {
            from: 'gardens',
            localField: 'gardenId',
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
            'garden._id': new Types.ObjectId(gardenId),
            'garden.userId': new Types.ObjectId(userId)
          }
        },
        ...extraPipeline,
        {
          $project: {
            _id: 1,
            name: 1,
            gardenId: 1,
            type: 1,
            year: 1,
            rows: 1,
            columns: 1,
            slots: 1,
            startedFrom: 1,
            archived: 1
          }
        }
      ])
      .exec();

    return containers;
  }

  async getContainer(
    containerId: string | null | undefined,
    userId: string,
    gardenId: string
  ): Promise<ContainerProjection | null> {
    if (!containerId) {
      return null;
    }

    const container = await this.getContainers(userId, gardenId, [
      {
        $match: {
          _id: new Types.ObjectId(containerId)
        }
      }
    ]);

    if (container.length === 0) {
      return null;
    }

    return container[0];
  }

  async editContainer(
    containerId: string,
    userId: string,
    gardenId: string,
    containerDTO: ContainerDTO,
    updateTasks: boolean,
    publishSync = true
  ): Promise<ContainerProjection | null> {
    const sanitizedContainerDTO = sanitizeContainerDTO(containerDTO);
    if (!sanitizedContainerDTO) {
      return null;
    }

    const oldContainer = await this.getContainer(containerId, userId, gardenId);
    if (!oldContainer) {
      return null;
    }

    let newContainerDTO = sanitizedContainerDTO;

    const oldSlots = oldContainer?.slots;
    if (oldSlots) {
      const slots = sanitizedContainerDTO?.slots ?? {};

      newContainerDTO = {
        ...sanitizedContainerDTO,
        slots: Object.keys(slots).reduce(
          (accumlatedSlots, slotIndex) => {
            const oldSlot = oldSlots[slotIndex];
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

            return accumlatedSlots;
          },
          {} as Record<string, ContainerSlotDTO>
        )
      };
    }

    const editedContainer = await this.containerModel.findByIdAndUpdate(
      containerId,
      { $set: newContainerDTO },
      { returnDocument: 'after' }
    );

    if (editedContainer && updateTasks) {
      const growingZoneData = await this.userService.getGrowingZoneData(userId);
      if (growingZoneData) {
        await this.createUpdatePlantTasksForContainer(editedContainer, userId, gardenId, undefined, growingZoneData);
      }
    }

    if (editedContainer && publishSync) {
      await this.publishGardenSync(userId, gardenId, 'container.updated');
    }

    return editedContainer;
  }

  async deleteContainer(containerId: string, userId: string, gardenId: string): Promise<ContainerProjection | null> {
    const oldContainer = await this.getContainer(containerId, userId, gardenId);
    if (!oldContainer) {
      return null;
    }

    const result = await this.containerModel.findByIdAndDelete(containerId);

    const growingZoneData = await this.userService.getGrowingZoneData(userId);

    const plantInstances = await this.plantInstanceService.getPlantInstancesByContainer(containerId, userId, gardenId);
    for (const plantInstance of plantInstances) {
      await this.plantInstanceService.closePlantInstance(plantInstance._id, userId, gardenId, growingZoneData, false);
    }

    await this.publishGardenSync(userId, gardenId, 'container.deleted');

    return result;
  }

  async updateContainerPlantsByTaskType(
    containerId: string,
    userId: string,
    gardenId: string,
    date: string,
    type: TaskType,
    plantInstanceIds: string[]
  ): Promise<number> {
    const growingZoneData = await this.userService.getGrowingZoneData(userId);
    if (!growingZoneData) {
      return 0;
    }

    const plantInstances = await this.plantInstanceService.getPlantInstancesByContainerAndIdIn(
      containerId,
      plantInstanceIds,
      userId,
      gardenId
    );

    const tasks = (
      await this.taskService.findTasks(userId, gardenId, [
        {
          $match: {
            type,
            completedOn: null,
            _id: {
              $in: plantInstanceIds
            }
          }
        }
      ])
    ).reduce<Record<string, TaskProjection>>((acc, task) => {
      if (task.plantInstanceId) {
        acc[task.plantInstanceId] = task;
      }

      return acc;
    }, {});

    let updatedCount = 0;

    for (const plantInstance of plantInstances) {
      updatedCount++;

      const task = tasks[plantInstance._id];
      if (task) {
        await this.taskService.findByIdAndUpdate(task._id, userId, gardenId, {
          completedOn: new Date(date)
        });
      }

      const updatedPlantInstance = await this.plantInstanceService.addPlantInstanceHistory(plantInstance, {
        status: fromTaskTypeToHistoryStatus(type),
        date: date,
        from: {
          containerId: plantInstance.containerId,
          slotId: plantInstance.slotId
        }
      });
      await this.plantInstanceService.createUpdatePlantInstanceTasks(
        updatedPlantInstance,
        userId,
        gardenId,
        growingZoneData
      );
    }

    if (updatedCount > 0) {
      await this.publishGardenSync(userId, gardenId, 'container.task-updated');
    }

    return updatedCount;
  }

  async createUpdatePlantTasksForSlot(
    container: ContainerProjection,
    userId: string,
    gardenId: string,
    slot: Slot,
    path: string,
    plantId: string | undefined,
    growingZoneData: GrowingZoneData
  ) {
    const plantInstance = await this.plantInstanceService.getPlantInstance(
      slot != null ? slot.plantInstanceId : null,
      userId,
      gardenId
    );
    if (plantInstance && (!plantId || plantInstance.plant === plantId)) {
      await this.plantInstanceService.createUpdateTasks(
        userId,
        gardenId,
        container,
        plantInstance,
        path,
        growingZoneData
      );
    }
  }

  async createUpdatePlantTasksForAllContainers(userId: string, gardenId: string, plantId?: string) {
    const growingZoneData = await this.userService.getGrowingZoneData(userId);
    if (growingZoneData) {
      const containers = await this.getContainers(userId, gardenId);

      for (const container of containers) {
        if (container.archived) {
          continue;
        }

        await this.createUpdatePlantTasksForContainer(container, userId, gardenId, plantId, growingZoneData);
      }
    }
  }

  async createUpdatePlantTasksForContainer(
    container: ContainerProjection | null | undefined,
    userId: string,
    gardenId: string,
    plantId: string | undefined,
    growingZoneData: GrowingZoneData
  ) {
    if (!container?.slots) {
      return;
    }

    const { slots } = container;

    for (const slotIndex of Object.keys(slots)) {
      await this.createUpdatePlantTasksForSlot(
        container,
        userId,
        gardenId,
        slots[slotIndex],
        `/container/${container._id}`,
        plantId,
        growingZoneData
      );
    }
  }

  async finishPlanningContainer(
    containerId: string | null | undefined,
    userId: string,
    gardenId: string
  ): Promise<number> {
    const container = await this.getContainer(containerId, userId, gardenId);
    if (!container) {
      throw new NotFoundException('Container does not exist!');
    }

    const { slots = {} } = container;
    let plantInstancesCreatedCount = 0;

    for (const slotIndex of Object.keys(slots)) {
      const slot = slots[slotIndex];

      if (!slot.plantInstanceId && slot.plant) {
        await this.plantInstanceService.addPlantInstance(
          {
            containerId: container._id,
            slotId: +slotIndex,
            plant: slot.plant,
            created: new Date().toISOString(),
            startedFrom: container.startedFrom ?? STARTED_FROM_TYPE_SEED,
            season: computeSeason()
          },
          userId,
          gardenId,
          { publishSync: false }
        );

        plantInstancesCreatedCount++;
      }
    }

    if (plantInstancesCreatedCount > 0) {
      await this.publishGardenSync(userId, gardenId, 'container.finish-planning');
    }

    return plantInstancesCreatedCount;
  }

  private async publishGardenSync(userId: string, gardenId: string, reason: string) {
    const [containers, plantInstances, tasks] = await Promise.all([
      this.getContainers(userId, gardenId),
      this.plantInstanceService.getPlantInstances(userId, gardenId),
      this.taskService.findTasks(userId, gardenId)
    ]);

    this.realtimePublisher.publishGardenSync(userId, gardenId, reason, {
      containers,
      gardenId,
      plantInstances,
      tasks
    });
  }
}
