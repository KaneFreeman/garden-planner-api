import { forwardRef, Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { PlantInstanceDTO, sanitizePlantInstanceDTO } from './dto/plant-instance.dto';
import { PlantInstanceDocument } from './interfaces/plant-instance.interface';
import { TaskService } from '../task/task.service';
import { PlantService } from '../plant/plant.service';
import plantData from '../data/plantData';
import getSlotTitle from '../util/slot.util';
import { ContainerDocument } from '../container/interfaces/container.interface';
import { ContainerService } from '../container/container.service';
import { isNotNullish, isNullish } from '../util/null.util';
import { ContainerSlotDTO } from '../container/dto/container-slot.dto';
import { HistoryStatus, TaskType } from '../interface';
import { PlantInstanceHistoryDto } from './dto/plant-instance-history.dto';

@Injectable()
export class PlantInstanceService {
  constructor(
    @InjectModel('PlantInstance')
    private readonly plantInstanceModel: Model<PlantInstanceDocument>,
    @Inject(forwardRef(() => PlantService)) private plantService: PlantService,
    @Inject(forwardRef(() => TaskService)) private taskService: TaskService,
    @Inject(forwardRef(() => ContainerService)) private containerService: ContainerService
  ) {}

  async addPlantInstance(createPlantInstanceDTO: PlantInstanceDTO, createTasks = true): Promise<PlantInstanceDocument> {
    const newPlantInstance = await this.plantInstanceModel.create(sanitizePlantInstanceDTO(createPlantInstanceDTO));

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
    }

    return updatePlantInstance;
  }

  async addPlantInstanceHistory(plantInstance: PlantInstanceDocument | null, history: PlantInstanceHistoryDto) {
    if (!plantInstance) {
      return null;
    }

    return this.plantInstanceModel
      .findByIdAndUpdate(plantInstance._id, {
        history: [...(plantInstance.history ?? []), history].sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        )
      })
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

          const plantInstanceHistory = subSlot?.plantInstanceHistory ?? [];
          if (subSlot && isNotNullish(subSlot.plantInstanceId)) {
            plantInstanceHistory.push(subSlot.plantInstanceId);
          }

          if (!subSlot || isNullish(subSlot.plantInstanceId)) {
            newSlots[`${plantInstance.slotId}`] = {
              ...newSlots[`${plantInstance.slotId}`],
              subSlot: {
                plantInstanceId: plantInstance._id,
                plantInstanceHistory
              }
            };
          }
        } else {
          const plantInstanceHistory = slot?.plantInstanceHistory ?? [];
          if (slot && isNotNullish(slot.plantInstanceId)) {
            plantInstanceHistory.push(slot.plantInstanceId);
          }

          newSlots[`${plantInstance.slotId}`] = {
            plantInstanceId: plantInstance._id,
            plantInstanceHistory,
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

    await this.taskService.createUpdatePlantedTask('spring', container, plantInstance, plant, data, path, slotTitle);

    await this.taskService.createUpdateTransplantedTask(
      'spring',
      container,
      plantInstance,
      plant,
      data,
      path,
      slotTitle
    );

    await this.taskService.createUpdateHarvestTask(
      container,
      plantInstance.slotId,
      plantInstance.subSlot ?? false,
      plantInstance,
      plant,
      path,
      slotTitle
    );

    await this.taskService.createUpdateFertilzeTasks(
      'spring',
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
}
