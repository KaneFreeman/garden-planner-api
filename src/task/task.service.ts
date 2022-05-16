import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, UpdateWithAggregationPipeline, UpdateQuery } from 'mongoose';
import subDays from 'date-fns/subDays';
import { CreateTaskDTO } from './dto/create-task.dto';
import { TaskDocument } from './interfaces/task.interface';
import { ContainerDocument } from '../container/interfaces/container.interface';
import { BaseSlotDocument } from '../container/interfaces/slot.interface';
import { ContainerType, FertilizerApplication, PlantData, TaskType } from '../interface';
import { PlantDocument } from '../plant/interfaces/plant.interface';
import growingZoneData from '../data/growingZoneData';
import addDays from 'date-fns/addDays';
import { ONE_WEEK, TWO_WEEKS } from '../constants';
import { isValidDate } from '../util/date.util';
import ordinalSuffixOf from '../util/number.util';
import { isEmpty, isNotEmpty } from '../util/string.util';

@Injectable()
export class TaskService {
  constructor(@InjectModel('Task') private readonly taskModel: Model<TaskDocument>) {}

  async addTask(createTaskDTO: CreateTaskDTO): Promise<TaskDocument> {
    const newTask = await this.taskModel.create(createTaskDTO);
    return newTask.save();
  }

  async getTaskById(taskId: string): Promise<TaskDocument | null> {
    return await this.taskModel.findById(taskId).exec();
  }

  async getTaskByTypeAndPath(type: TaskType, path: string): Promise<TaskDocument | null> {
    return this.taskModel.findOne({ type, path }).exec();
  }

  async getTasksByTypeAndPath(type: TaskType, path: string): Promise<TaskDocument[]> {
    return this.taskModel.find({ type, path }).exec();
  }

  async getTasks(): Promise<TaskDocument[]> {
    return this.taskModel.find().exec();
  }

  async getTasksByPath(path: string): Promise<TaskDocument[]> {
    return this.taskModel.find({ path }).exec();
  }

  async editTask(taskId: string, createTaskDTO: CreateTaskDTO): Promise<TaskDocument | null> {
    return this.taskModel.findByIdAndUpdate(taskId, createTaskDTO, {
      new: true
    });
  }

  async updatePlantName(path: string, oldName: string, newName: string) {
    const tasks = await this.getTasksByPath(path);

    for (const task of tasks) {
      await this.taskModel.findByIdAndUpdate(task._id, {
        text: task.text.replaceAll(oldName, newName)
      });
    }
  }

  async bulkEditTasks(
    filter: FilterQuery<TaskDocument>,
    update: UpdateWithAggregationPipeline | UpdateQuery<TaskDocument>
  ): Promise<number> {
    const result = await this.taskModel.updateMany(filter, update);
    return result.modifiedCount;
  }

  async deleteTask(taskId: string, force = false): Promise<TaskDocument | null> {
    const task = await this.getTaskById(taskId);
    if (!force && task?.type !== 'Custom') {
      return null;
    }

    return await this.taskModel.findByIdAndRemove(taskId);
  }

  async deleteTasksByContainer(containerId: string): Promise<void> {
    await this.taskModel.deleteMany({ containerId }).exec();
  }

  getPlantedStartAndDueDate(
    season: 'spring' | 'fall',
    type: ContainerType,
    data: PlantData | undefined
  ): { start: Date; due: Date } | undefined {
    const howToGrowData = data?.howToGrow[season];
    if (type === 'Inside' && howToGrowData?.indoor) {
      return {
        start: subDays(growingZoneData.lastFrost, howToGrowData.indoor.min),
        due: subDays(growingZoneData.lastFrost, howToGrowData.indoor.max)
      };
    }

    if (type === 'Outside' && howToGrowData?.outdoor) {
      return {
        start: subDays(growingZoneData.lastFrost, howToGrowData.outdoor.min),
        due: subDays(growingZoneData.lastFrost, howToGrowData.outdoor.max)
      };
    }

    return undefined;
  }

  getTransplantedStartAndDueDate(
    season: 'spring' | 'fall',
    data: PlantData | undefined,
    plantedDate: Date | undefined
  ): { start: Date; due: Date } | undefined {
    const howToGrowData = data?.howToGrow[season];
    if (howToGrowData?.indoor) {
      if (plantedDate) {
        return {
          start: addDays(plantedDate, howToGrowData.indoor.transplant_min),
          due: addDays(plantedDate, howToGrowData.indoor.transplant_max)
        };
      }

      return {
        start: subDays(growingZoneData.lastFrost, howToGrowData.indoor.min - howToGrowData.indoor.transplant_min),
        due: subDays(growingZoneData.lastFrost, howToGrowData.indoor.max - howToGrowData.indoor.transplant_max)
      };
    }

    return undefined;
  }

  async createUpdatePlantedTask(
    season: 'spring' | 'fall',
    container: ContainerDocument,
    slot: BaseSlotDocument,
    plant: PlantDocument | null,
    data: PlantData | undefined,
    path: string,
    slotTitle: string
  ) {
    const task = await this.getTaskByTypeAndPath('Plant', path);
    const dates = this.getPlantedStartAndDueDate(season, container.type, data);
    if (
      !plant ||
      !data ||
      !dates ||
      !isValidDate(dates.start) ||
      !isValidDate(dates.due) ||
      slot.startedFrom === 'Transplant'
    ) {
      if (task) {
        await this.deleteTask(task._id, true);
      }
      return;
    }

    const { start, due } = dates;

    const completedOn = slot.status && slot.status !== 'Not Planted' ? slot.plantedDate ?? null : null;

    if (!task) {
      await this.addTask({
        text: `Plant ${plant.name} in ${container.name} at ${slotTitle}`,
        type: 'Plant',
        start,
        due,
        containerId: container._id,
        path,
        completedOn
      });
    } else {
      await this.editTask(task._id, {
        text: `Plant ${plant.name} in ${container.name} at ${slotTitle}`,
        type: task.type,
        start,
        due,
        containerId: container._id,
        path: task.path,
        completedOn
      });
    }
  }

  async createUpdateTransplantedTask(
    season: 'spring' | 'fall',
    container: ContainerDocument,
    slot: BaseSlotDocument,
    plant: PlantDocument | null,
    data: PlantData | undefined,
    path: string,
    slotTitle: string
  ) {
    const task = await this.getTaskByTypeAndPath('Transplant', path);
    const dates = this.getTransplantedStartAndDueDate(season, data, slot.plantedDate);
    if (
      !plant ||
      !data ||
      !slot.status ||
      slot.status === 'Not Planted' ||
      !dates ||
      !isValidDate(dates.start) ||
      !isValidDate(dates.due)
    ) {
      if (task) {
        await this.deleteTask(task._id, true);
      }
      return;
    }

    const { start, due } = dates;

    const completedOn = slot.status === 'Transplanted' ? slot.transplantedDate ?? null : null;

    if (!task) {
      await this.addTask({
        text: `Transplant ${plant.name} from ${container.name} at ${slotTitle}`,
        type: 'Transplant',
        start,
        due,
        containerId: container._id,
        path,
        completedOn
      });
    } else {
      await this.editTask(task._id, {
        text: `Transplant ${plant.name} from ${container.name} at ${slotTitle}`,
        type: task.type,
        start,
        due,
        containerId: container._id,
        path: task.path,
        completedOn
      });
    }
  }

  getHarvestStartAndDueDate(
    plant: PlantDocument | null,
    plantedDate: Date | undefined
  ): { start: Date; due: Date } | undefined {
    if (
      plantedDate &&
      plant?.daysToMaturity !== undefined &&
      plant?.daysToMaturity.length > 0 &&
      plant?.daysToMaturity[0] !== undefined &&
      plant?.daysToMaturity[0] !== null &&
      plant?.daysToMaturity[0] !== 0
    ) {
      if (
        plant.daysToMaturity.length > 1 &&
        plant.daysToMaturity[1] !== undefined &&
        plant.daysToMaturity[1] !== null &&
        plant.daysToMaturity[1] !== 0 &&
        plant.daysToMaturity[0] !== plant.daysToMaturity[1]
      ) {
        return {
          start: addDays(plantedDate, plant.daysToMaturity[0]),
          due: addDays(plantedDate, plant.daysToMaturity[1])
        };
      }

      return {
        start: addDays(plantedDate, plant.daysToMaturity[0]),
        due: addDays(addDays(plantedDate, plant.daysToMaturity[0]), TWO_WEEKS)
      };
    }

    return undefined;
  }

  async createUpdateHarvestTask(
    container: ContainerDocument,
    slot: BaseSlotDocument,
    plant: PlantDocument | null,
    path: string,
    slotTitle: string
  ) {
    const task = await this.getTaskByTypeAndPath('Harvest', path);

    const dates = this.getHarvestStartAndDueDate(plant, slot.plantedDate);
    if (
      !plant ||
      slot.status === 'Not Planted' ||
      slot.status === 'Transplanted' ||
      !dates ||
      !isValidDate(dates.start) ||
      !isValidDate(dates.due)
    ) {
      if (task) {
        await this.deleteTask(task._id, true);
      }
      return;
    }

    const { start, due } = dates;

    const completedOn = slot.status === 'Harvested' ? slot.plantedDate ?? null : null;

    if (!task) {
      await this.addTask({
        text: `Harvest ${plant.name} from ${container.name} at ${slotTitle}`,
        type: 'Harvest',
        start,
        due,
        containerId: container._id,
        path,
        completedOn
      });
    } else {
      await this.editTask(task._id, {
        text: `Harvest ${plant.name} from ${container.name} at ${slotTitle}`,
        type: task.type,
        start,
        due,
        containerId: container._id,
        path: task.path,
        completedOn
      });
    }
  }

  getFertilizeStartAndDueDate(
    plantedDate: Date | undefined,
    transplantedDate: Date | undefined,
    fertilizerApplication: FertilizerApplication
  ): { start: Date; due: Date } | undefined {
    const fromDate = fertilizerApplication.from === 'Transplanted' ? transplantedDate : plantedDate;
    if (fromDate) {
      return {
        start: addDays(fromDate, fertilizerApplication.start),
        due: addDays(addDays(fromDate, fertilizerApplication.start), fertilizerApplication.end ?? ONE_WEEK)
      };
    }

    return undefined;
  }

  async createUpdateIndoorFertilzeTasksTask(
    season: 'spring' | 'fall',
    container: ContainerDocument,
    slot: BaseSlotDocument,
    plant: PlantDocument | null,
    data: PlantData | undefined,
    path: string,
    slotTitle: string
  ) {
    const tasks = await this.getTasksByTypeAndPath('Fertilize', path);
    const taskTexts: string[] = [];
    const tasksByText = tasks.reduce((byText, task) => {
      byText[task.text] = task;
      return byText;
    }, {} as Record<string, TaskDocument>);

    const howToGrowData = data?.howToGrow[season];
    const fertilizeData = container.type === 'Inside' ? howToGrowData?.indoor?.fertilize : howToGrowData?.fertilize;

    if (
      !plant ||
      !data ||
      fertilizeData === undefined ||
      (container.type === 'Inside' && slot.startedFrom === 'Transplant') ||
      slot.status === 'Transplanted'
    ) {
      if (tasks.length > 0) {
        for (const task of tasks) {
          await this.deleteTask(task._id, true);
        }
      }
      return;
    }

    let i = 0;
    for (const fertilizerApplication of fertilizeData) {
      i += 1;
      const dates = this.getFertilizeStartAndDueDate(
        slot.plantedDate,
        slot.transplantedFromDate,
        fertilizerApplication
      );
      if (slot.status === 'Not Planted' || !dates || !isValidDate(dates.start) || !isValidDate(dates.due)) {
        continue;
      }

      const { start, due } = dates;

      let text: string;
      if (fertilizeData.length > 1 && isEmpty(fertilizerApplication.description)) {
        text = `Fertilize (${ordinalSuffixOf(i)} time) ${plant.name} in ${container.name} at ${slotTitle}`;
      } else if (isNotEmpty(fertilizerApplication.description)) {
        text = `Fertilize ${plant.name} (${fertilizerApplication.description}) in ${container.name} at ${slotTitle}`;
      } else {
        text = `Fertilize ${plant.name} in ${container.name} at ${slotTitle}`;
      }

      const task = tasksByText[text];
      taskTexts.push(text);
      if (!task) {
        await this.addTask({
          text,
          type: 'Fertilize',
          start,
          due,
          containerId: container._id,
          path,
          completedOn: null
        });
      } else if (task.completedOn === null) {
        await this.editTask(task._id, {
          text,
          type: 'Fertilize',
          start,
          due,
          containerId: container._id,
          path,
          completedOn: null
        });
      }
    }

    for (const task of tasks) {
      if (taskTexts.includes(task.text)) {
        continue;
      }

      await this.deleteTask(task._id, true);
    }
  }
}
