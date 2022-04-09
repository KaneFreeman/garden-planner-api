import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreateTaskDTO } from './dto/create-task.dto';
import { Task } from './interfaces/task.interface';
import { Container } from '../container/interfaces/container.interface';
import { PlantData, Slot, TaskType } from '../interface';
import { Plant } from '../plant/interfaces/plant.interface';
import { parseDate } from '../util/date.util';

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

  getPlantedStartAndDueDate(
    data: PlantData,
  ): { start: Date; due: Date } | undefined {
    if (
      data.howToGrow.indoor?.indoor_min &&
      data.howToGrow.indoor?.indoor_max
    ) {
      return {
        start: parseDate(data.howToGrow.indoor.indoor_min),
        due: parseDate(data.howToGrow.indoor.indoor_max),
      };
    }

    if (
      data.howToGrow.outdoor?.direct_min &&
      data.howToGrow.outdoor.direct_max
    ) {
      return {
        start: parseDate(data.howToGrow.outdoor.direct_min),
        due: parseDate(data.howToGrow.outdoor.direct_max),
      };
    }

    return undefined;
  }

  getTransplantedStartAndDueDate(
    data: PlantData,
  ): { start: Date; due: Date } | undefined {
    if (
      data.howToGrow.indoor?.transplant_min &&
      data.howToGrow.indoor?.transplant_max
    ) {
      return {
        start: parseDate(data.howToGrow.indoor.transplant_min),
        due: parseDate(data.howToGrow.indoor.transplant_max),
      };
    }

    return undefined;
  }

  async createUpdatePlantedTask(
    container: Container,
    slot: Slot,
    plant: Plant,
    data: PlantData,
    path: string,
    slotTitle: string,
  ) {
    const dates = this.getPlantedStartAndDueDate(data);
    if (!dates) {
      return;
    }

    const { start, due } = dates;

    const task = await this.getTaskByTypeAndPath('Plant', path);
    const completedOn =
      slot.status && slot.status !== 'Not Planted'
        ? slot.plantedDate ?? null
        : null;

    if (!task) {
      this.addTask({
        text: `Plant ${plant.name} in ${container.name} at ${slotTitle}`,
        type: 'Plant',
        start,
        due,
        path,
        completedOn,
      });
    } else {
      this.editTask(task._id, {
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
    container: Container,
    slot: Slot,
    plant: Plant,
    data: PlantData,
    path: string,
    slotTitle: string,
  ) {
    const dates = this.getTransplantedStartAndDueDate(data);
    if (!dates) {
      return;
    }

    const { start, due } = dates;

    const task = await this.getTaskByTypeAndPath('Transplant', path);
    const completedOn =
      slot.status === 'Transplanted' ? slot.plantedDate ?? null : null;

    if (!task) {
      this.addTask({
        text: `Transplant ${plant.name} from ${container.name} at ${slotTitle}`,
        type: 'Transplant',
        start,
        due,
        path,
        completedOn,
      });
    } else {
      this.editTask(task._id, {
        text: `Transplant ${plant.name} from ${container.name} at ${slotTitle}`,
        type: task.type,
        start,
        due,
        path: task.path,
        completedOn,
      });
    }
  }
}
