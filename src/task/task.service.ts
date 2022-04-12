import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import subDays from 'date-fns/subDays';
import { CreateTaskDTO } from './dto/create-task.dto';
import { Task } from './interfaces/task.interface';
import { ContainerDocument } from '../container/interfaces/container.interface';
import { BaseSlotDocument } from '../container/interfaces/slot.interface';
import { ContainerType, PlantData, TaskType } from '../interface';
import { PlantDocument } from '../plant/interfaces/plant.interface';
import growingZoneData from '../data/growingZoneData';
import addDays from 'date-fns/addDays';
import { TWO_WEEKS } from '../constants';
import { isValidDate } from '../util/date.util';

@Injectable()
export class TaskService {
  constructor(@InjectModel('Task') private readonly taskModel: Model<Task>) {}

  async addTask(createTaskDTO: CreateTaskDTO): Promise<Task> {
    const newTask = await this.taskModel.create(createTaskDTO);
    return newTask.save();
  }

  async getTaskById(taskId: string): Promise<Task> {
    const task = await this.taskModel.findById(taskId).exec();
    return task;
  }

  async getTaskByTypeAndPath(type: TaskType, path: string): Promise<Task> {
    const task = await this.taskModel.findOne({ type, path }).exec();
    return task;
  }

  async getTasks(): Promise<Task[]> {
    const tasks = await this.taskModel.find().exec();
    return tasks;
  }

  async getTasksByPath(path: string): Promise<Task[]> {
    const tasks = await this.taskModel.find({ path }).exec();
    return tasks;
  }

  async editTask(taskId: string, createTaskDTO: CreateTaskDTO): Promise<Task> {
    const editedTask = await this.taskModel.findByIdAndUpdate(
      taskId,
      createTaskDTO,
      { new: true },
    );
    return editedTask;
  }

  async deleteTask(taskId: string): Promise<Task> {
    const deletedTask = await this.taskModel.findByIdAndRemove(taskId);
    return deletedTask;
  }

  getSpringPlantedStartAndDueDate(
    type: ContainerType,
    data: PlantData,
  ): { start: Date; due: Date } | undefined {
    if (type === 'Inside' && data.howToGrow.spring?.indoor) {
      return {
        start: subDays(
          growingZoneData.lastFrost,
          data.howToGrow.spring.indoor.min,
        ),
        due: subDays(
          growingZoneData.lastFrost,
          data.howToGrow.spring.indoor.max,
        ),
      };
    }

    if (type === 'Outside' && data.howToGrow.spring?.outdoor) {
      return {
        start: subDays(
          growingZoneData.lastFrost,
          data.howToGrow.spring.outdoor.min,
        ),
        due: subDays(
          growingZoneData.lastFrost,
          data.howToGrow.spring.outdoor.max,
        ),
      };
    }

    return undefined;
  }

  getTransplantedStartAndDueDate(
    data: PlantData,
    plantedDate?: Date,
  ): { start: Date; due: Date } | undefined {
    if (data.howToGrow.spring?.indoor) {
      if (plantedDate) {
        return {
          start: addDays(
            plantedDate,
            data.howToGrow.spring.indoor.transplant_min,
          ),
          due: addDays(
            plantedDate,
            data.howToGrow.spring.indoor.transplant_max,
          ),
        };
      }

      return {
        start: subDays(
          growingZoneData.lastFrost,
          data.howToGrow.spring.indoor.min -
            data.howToGrow.spring.indoor.transplant_min,
        ),
        due: subDays(
          growingZoneData.lastFrost,
          data.howToGrow.spring.indoor.max -
            data.howToGrow.spring.indoor.transplant_max,
        ),
      };
    }

    return undefined;
  }

  async createUpdatePlantedTask(
    season: 'spring' | 'fall',
    container: ContainerDocument,
    slot: BaseSlotDocument,
    plant: PlantDocument,
    data: PlantData,
    path: string,
    slotTitle: string,
  ) {
    const dates =
      season === 'spring'
        ? this.getSpringPlantedStartAndDueDate(container.type, data)
        : this.getSpringPlantedStartAndDueDate(container.type, data);
    if (!dates || !isValidDate(dates.start) || !isValidDate(dates.due)) {
      return;
    }

    const { start, due } = dates;

    const task = await this.getTaskByTypeAndPath('Plant', path);
    const completedOn =
      slot.status && slot.status !== 'Not Planted'
        ? slot.plantedDate ?? null
        : null;

    if (!task) {
      await this.addTask({
        text: `Plant ${plant.name} in ${container.name} at ${slotTitle}`,
        type: 'Plant',
        start,
        due,
        path,
        completedOn,
      });
    } else {
      await this.editTask(task._id, {
        text: `Plant ${plant.name} in ${container.name} at ${slotTitle}`,
        type: task.type,
        start,
        due,
        path: task.path,
        completedOn,
      });
    }
  }

  async createUpdateTransplantedTask(
    container: ContainerDocument,
    slot: BaseSlotDocument,
    plant: PlantDocument,
    data: PlantData,
    path: string,
    slotTitle: string,
  ) {
    const dates = this.getTransplantedStartAndDueDate(data, slot.plantedDate);
    if (!dates || !isValidDate(dates.start) || !isValidDate(dates.due)) {
      return;
    }

    const { start, due } = dates;

    const task = await this.getTaskByTypeAndPath('Transplant', path);
    const completedOn =
      slot.status === 'Transplanted' ? slot.plantedDate ?? null : null;

    if (!task) {
      await this.addTask({
        text: `Transplant ${plant.name} from ${container.name} at ${slotTitle}`,
        type: 'Transplant',
        start,
        due,
        path,
        completedOn,
      });
    } else {
      await this.editTask(task._id, {
        text: `Transplant ${plant.name} from ${container.name} at ${slotTitle}`,
        type: task.type,
        start,
        due,
        path: task.path,
        completedOn,
      });
    }
  }

  getHarvestStartAndDueDate(
    plant: PlantDocument,
    plantedDate?: Date,
  ): { start: Date; due: Date } | undefined {
    if (
      plant.daysToMaturity !== undefined &&
      plant.daysToMaturity.length > 0 &&
      plant.daysToMaturity[0] !== undefined
    ) {
      if (
        plant.daysToMaturity.length > 1 &&
        plant.daysToMaturity[1] !== undefined &&
        plant.daysToMaturity[1] !== null &&
        plant.daysToMaturity[0] !== plant.daysToMaturity[1]
      ) {
        return {
          start: addDays(plantedDate, plant.daysToMaturity[0]),
          due: addDays(plantedDate, plant.daysToMaturity[1]),
        };
      }

      return {
        start: addDays(plantedDate, plant.daysToMaturity[0]),
        due: addDays(addDays(plantedDate, plant.daysToMaturity[0]), TWO_WEEKS),
      };
    }

    return undefined;
  }

  async createUpdateHarvestTask(
    container: ContainerDocument,
    slot: BaseSlotDocument,
    plant: PlantDocument,
    path: string,
    slotTitle: string,
  ) {
    const dates = this.getHarvestStartAndDueDate(plant, slot.plantedDate);
    if (!dates || !isValidDate(dates.start) || !isValidDate(dates.due)) {
      return;
    }

    const { start, due } = dates;

    const task = await this.getTaskByTypeAndPath('Harvest', path);
    const completedOn =
      slot.status === 'Harvested' ? slot.plantedDate ?? null : null;

    if (!task) {
      await this.addTask({
        text: `Harvest ${plant.name} from ${container.name} at ${slotTitle}`,
        type: 'Harvest',
        start,
        due,
        path,
        completedOn,
      });
    } else {
      await this.editTask(task._id, {
        text: `Harvest ${plant.name} from ${container.name} at ${slotTitle}`,
        type: task.type,
        start,
        due,
        path: task.path,
        completedOn,
      });
    }
  }
}
