import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { PlantInstanceDTO } from './dto/plant-instance.dto';
import { PlantInstanceDocument } from './interfaces/plant-instance.interface';
import { TaskService } from '../task/task.service';
import { PlantService } from '../plant/plant.service';
import plantData from '../data/plantData';
import getSlotTitle from '../util/slot.util';
import { ContainerDocument } from '../container/interfaces/container.interface';
import { ContainerService } from '../container/container.service';
import { isNullish } from '../util/null.util';
import { ContainerSlotDTO } from '../container/dto/container-slot.dto';

@Injectable()
export class PlantInstanceService {
  constructor(
    @InjectModel('PlantInstance')
    private readonly plantInstanceModel: Model<PlantInstanceDocument>,
    @Inject(forwardRef(() => PlantService)) private plantService: PlantService,
    private taskService: TaskService,
    @Inject(forwardRef(() => ContainerService)) private containerService: ContainerService
  ) {}

  async addPlantInstance(createPlantInstanceDTO: PlantInstanceDTO): Promise<PlantInstanceDocument> {
    const newPlantInstance = await this.plantInstanceModel.create(createPlantInstanceDTO);
    return newPlantInstance.save();
  }

  async getPlantInstance(plantInstanceId: string | undefined): Promise<PlantInstanceDocument | null> {
    if (!plantInstanceId) {
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

  async editPlantInstance(
    plantInstanceId: string,
    createPlantInstanceDTO: PlantInstanceDTO
  ): Promise<PlantInstanceDocument | null> {
    const editedPlantInstance = await this.plantInstanceModel.findByIdAndUpdate(
      plantInstanceId,
      createPlantInstanceDTO,
      { new: true }
    );

    if (editedPlantInstance) {
      await this.createUpdatePlantInstanceTasks(editedPlantInstance);

      const container = await this.containerService.getContainer(editedPlantInstance.containerId);
      if (container && container._id) {
        const slot = container.slots?.get(`${editedPlantInstance.slotId}`);
        const newSlots: Record<string, ContainerSlotDTO> = {};
        container.slots?.forEach((slot, key) => {
          newSlots[key] = slot.toObject<ContainerSlotDTO>();
        });

        if (editedPlantInstance.subSlot) {
          const subSlot = slot?.subSlot;

          if (
            !subSlot ||
            ((subSlot.plannedPlantId === editedPlantInstance.plant || isNullish(subSlot.plannedPlantId)) &&
              isNullish(subSlot.plantInstanceId))
          ) {
            newSlots[`${editedPlantInstance.slotId}`] = {
              ...newSlots[`${editedPlantInstance.slotId}`],
              subSlot: {
                plantInstanceId: editedPlantInstance._id,
                plannedPlantId: undefined
              }
            };
          }
        } else {
          newSlots[`${editedPlantInstance.slotId}`] = {
            plantInstanceId: editedPlantInstance._id,
            plannedPlantId: undefined
          };
        }

        await this.containerService.editContainer(container._id, {
          slots: newSlots
        });
      }
    }

    return editedPlantInstance;
  }

  async deletePlantInstance(plantInstanceId: string): Promise<PlantInstanceDocument | null> {
    const deletedPlantInstance = await this.plantInstanceModel.findByIdAndRemove(plantInstanceId);
    await this.taskService.deleteOpenTasksByPlantInstance(plantInstanceId);
    return deletedPlantInstance;
  }

  // TODO async fertilizePlantInstance(plantInstanceId: string, data: PlantInstanceFertilizeDTO): Promise<number> {
  //   return this.taskService.bulkEditTasks(
  //     { plantInstanceId, type: 'Fertilize', completedOn: null, start: { $lt: data.date } },
  //     { completedOn: data.date }
  //   );
  // }

  async createUpdateTasks(
    container: ContainerDocument,
    plantInstance: PlantInstanceDocument,
    path: string,
    slotTitle: string
  ) {
    const plant = await this.plantService.getPlant(plantInstance.plant);
    const data = plant?.type ? plantData[plant.type] : undefined;

    await this.taskService.createUpdatePlantedTask('spring', container, plantInstance, plant, data, path, slotTitle);

    if (container.type === 'Inside') {
      await this.taskService.createUpdateTransplantedTask(
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
    } else {
      await this.taskService.createUpdateHarvestTask(
        container,
        plantInstance.slotId,
        plantInstance.subSlot ?? false,
        plantInstance,
        plant,
        path,
        slotTitle
      );
    }

    await this.taskService.createUpdateIndoorFertilzeTasksTask(
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

  async createUpdatePlantInstanceTasks(plantInstance: PlantInstanceDocument) {
    const container = await this.containerService.getContainer(plantInstance.containerId);

    if (container) {
      const path = `/container/${container._id}/slot/${plantInstance.slotId}`;
      const slotTitle = getSlotTitle(plantInstance.slotId, container.rows);

      await this.createUpdateTasks(container, plantInstance, path, slotTitle);
    }
  }
}
