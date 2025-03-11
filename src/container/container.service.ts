import { forwardRef, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
import { GardenService } from '../garden/garden.service';
import { GrowingZoneData, TaskType } from '../interface';
import { PlantInstanceService } from '../plant-instance/plant-instance.service';
import { TaskService } from '../task/services/task.service';
import { UserService } from '../users/user.service';
import { fromTaskTypeToHistoryStatus } from '../util/history.util';
import { isNotNullish } from '../util/null.util';
import getSlotTitle from '../util/slot.util';
import { ContainerSlotDTO } from './dto/container-slot.dto';
import { ContainerDTO, sanitizeContainerDTO } from './dto/container.dto';
import { BaseSlot } from './interfaces/container-slot.interface';
import { ContainerDocument } from './interfaces/container.document';
import { ContainerProjection } from './interfaces/container.projection';
import { TaskProjection } from '../task/interfaces/task.projection';

@Injectable()
export class ContainerService {
  constructor(
    @InjectModel('Container')
    private readonly containerModel: Model<ContainerDocument>,
    private logger: Logger,
    @Inject(forwardRef(() => TaskService)) private taskService: TaskService,
    @Inject(forwardRef(() => GardenService)) private gardenService: GardenService,
    @Inject(forwardRef(() => PlantInstanceService)) private plantInstanceService: PlantInstanceService,
    @Inject(forwardRef(() => UserService)) private userService: UserService
  ) {}

  async addContainer(containerDTO: ContainerDTO, userId: string, gardenId: string): Promise<ContainerProjection> {
    const garden = this.gardenService.getGarden(gardenId, userId);
    if (!garden) {
      throw new NotFoundException('Garden does not exist!');
    }

    const newContainer = await this.containerModel.create({
      ...sanitizeContainerDTO(containerDTO),
      gardenId: new Types.ObjectId(gardenId)
    });
    return newContainer.save();
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
    updateTasks: boolean
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

            return slots;
          },
          {} as Record<string, ContainerSlotDTO>
        )
      };
    }

    const editedContainer = await this.containerModel.findByIdAndUpdate(
      containerId,
      { $set: newContainerDTO },
      { new: true }
    );

    if (editedContainer && updateTasks) {
      const growingZoneData = await this.userService.getGrowingZoneData(userId);
      if (growingZoneData) {
        await this.createUpdatePlantTasks(editedContainer, userId, gardenId, undefined, growingZoneData);
      }
    }

    return editedContainer;
  }

  async deleteContainer(containerId: string, userId: string, gardenId: string): Promise<ContainerProjection | null> {
    const oldContainer = await this.getContainer(containerId, userId, gardenId);
    if (!oldContainer) {
      return null;
    }

    const result = this.containerModel.findByIdAndDelete(containerId);

    const growingZoneData = await this.userService.getGrowingZoneData(userId);

    const plantInstances = await this.plantInstanceService.getPlantInstancesByContainer(containerId, userId, gardenId);
    for (const plantInstance of plantInstances) {
      await this.plantInstanceService.closePlantInstance(plantInstance._id, userId, gardenId, growingZoneData);
    }

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
      acc[task.plantInstanceId] = task;

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
          slotId: plantInstance.slotId,
          subSlot: plantInstance.subSlot
        }
      });
      await this.plantInstanceService.createUpdatePlantInstanceTasks(
        updatedPlantInstance,
        userId,
        gardenId,
        growingZoneData
      );
    }

    return updatedCount;
  }

  async createUpdatePlantTasksForSlot(
    container: ContainerProjection,
    userId: string,
    gardenId: string,
    slot: BaseSlot,
    path: string,
    slotTitle: string,
    plantId: string | undefined,
    growingZoneData: GrowingZoneData
  ) {
    const plantInstance = await this.plantInstanceService.getPlantInstance(slot.plantInstanceId, userId, gardenId);
    if (plantInstance && (!plantId || plantInstance.plant === plantId)) {
      this.plantInstanceService.createUpdateTasks(
        userId,
        gardenId,
        container,
        plantInstance,
        path,
        slotTitle,
        growingZoneData
      );
    }
  }

  async createUpdatePlantTasks(
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
      const slot = slots[slotIndex];
      const path = `/container/${container._id}/slot/${slotIndex}`;
      const slotTitle = getSlotTitle(+slotIndex, container.rows);

      await this.createUpdatePlantTasksForSlot(
        container,
        userId,
        gardenId,
        slot,
        path,
        slotTitle,
        plantId,
        growingZoneData
      );

      if (slot.subSlot) {
        await this.createUpdatePlantTasksForSlot(
          container,
          userId,
          gardenId,
          slot.subSlot,
          `${path}/sub-slot`,
          slotTitle,
          plantId,
          growingZoneData
        );
      }
    }
  }
}
