import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, UpdateWithAggregationPipeline, UpdateQuery } from 'mongoose';
import subDays from 'date-fns/subDays';
import addDays from 'date-fns/addDays';
import { ONE_WEEK, TWO_WEEKS } from '../constants';
import { ContainerDocument } from '../container/interfaces/container.interface';
import {
  ContainerType,
  FERTILIZE,
  FertilizerApplication,
  HARVESTED,
  PlantData,
  TaskType,
  TRANSPLANTED
} from '../interface';
import { ContainerService } from '../container/container.service';
import { PlantDocument } from '../plant/interfaces/plant.interface';
import {
  findHistoryByStatus,
  findHistoryFrom,
  getPlantedDate,
  getTransplantedDate
} from '../plant-instance/util/history.util';
import growingZoneData from '../data/growingZoneData';
import { isNullish } from '../util/null.util';
import { isValidDate } from '../util/date.util';
import ordinalSuffixOf from '../util/number.util';
import { isEmpty, isNotEmpty } from '../util/string.util';
import { PlantInstanceDocument } from '../plant-instance/interfaces/plant-instance.interface';
import { CreateTaskDTO } from './dto/create-task.dto';
import { TaskDocument } from './interfaces/task.interface';
import { PlantInstanceService } from '../plant-instance/plant-instance.service';

@Injectable()
export class TaskService {
  constructor(
    @InjectModel('Task') private readonly taskModel: Model<TaskDocument>,
    @Inject(forwardRef(() => ContainerService)) private containerService: ContainerService,
    @Inject(forwardRef(() => PlantInstanceService)) private plantInstanceService: PlantInstanceService
  ) {}

  async addTask(createTaskDTO: CreateTaskDTO): Promise<TaskDocument> {
    const newTask = await this.taskModel.create(createTaskDTO);
    return newTask.save();
  }

  async getTaskById(taskId: string): Promise<TaskDocument | null> {
    return await this.taskModel.findById(taskId).exec();
  }

  async getTaskByTypeAndPlantInstanceId(type: TaskType, plantInstanceId: string): Promise<TaskDocument | null> {
    return this.taskModel.findOne({ type: { $eq: type }, plantInstanceId: { $eq: plantInstanceId } }).exec();
  }

  async getTasksByTypeAndPlantInstanceId(type: TaskType, plantInstanceId: string): Promise<TaskDocument[]> {
    return this.taskModel.find({ type: { $eq: type }, plantInstanceId: { $eq: plantInstanceId } }).exec();
  }

  async getTasks(): Promise<TaskDocument[]> {
    return this.taskModel.find().exec();
  }

  async getTasksByPlantInstanceId(plantInstanceId: string): Promise<TaskDocument[]> {
    return this.taskModel.find({ plantInstanceId: { $eq: plantInstanceId } }).exec();
  }

  async editTask(
    taskId: string,
    createTaskDTO: CreateTaskDTO,
    updateContainerTasks: boolean
  ): Promise<TaskDocument | null> {
    const task = await this.taskModel.findByIdAndUpdate(taskId, createTaskDTO, {
      new: true
    });

    if (task?.type === FERTILIZE && updateContainerTasks) {
      const plantInstance = await this.plantInstanceService.getPlantInstance(task.plantInstanceId);
      await this.plantInstanceService.createUpdatePlantInstanceTasks(plantInstance);
    }

    return task;
  }

  async updatePlantName(plantInstanceId: string, oldName: string, newName: string) {
    const tasks = await this.getTasksByPlantInstanceId(plantInstanceId);

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
    const tasks = await this.taskModel.find(filter).exec();

    for (const task of tasks) {
      await this.taskModel.findByIdAndUpdate(task._id, update);

      if (task?.type === FERTILIZE) {
        const plantInstance = await this.plantInstanceService.getPlantInstance(task.plantInstanceId);
        await this.plantInstanceService.createUpdatePlantInstanceTasks(plantInstance);
      }
    }

    return tasks.length;
  }

  async deleteTask(taskId: string, force = false): Promise<TaskDocument | null> {
    const task = await this.getTaskById(taskId);
    if (!force && task?.type !== 'Custom') {
      return null;
    }

    return await this.taskModel.findByIdAndRemove(taskId);
  }

  async deleteOpenTasksByPlantInstance(plantInstanceId: string): Promise<void> {
    await this.taskModel.deleteMany({ plantInstanceId, completedOn: null }).exec();
  }

  getPlantedStartAndDueDate(
    season: 'spring' | 'fall',
    type: ContainerType,
    data: PlantData | undefined
  ): { start: Date; due: Date } | undefined {
    const howToGrowData = data?.howToGrow[season];
    if (howToGrowData?.indoor) {
      return {
        start: subDays(growingZoneData.lastFrost, howToGrowData.indoor.min),
        due: subDays(growingZoneData.lastFrost, howToGrowData.indoor.max)
      };
    }

    if (howToGrowData?.outdoor) {
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
    plantedDate: Date | null
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
    instance: PlantInstanceDocument | null,
    plant: PlantDocument | null,
    data: PlantData | undefined,
    path: string,
    slotTitle: string
  ) {
    if (!instance?._id || !container._id) {
      return;
    }

    const task = await this.getTaskByTypeAndPlantInstanceId('Plant', instance._id);
    const dates = this.getPlantedStartAndDueDate(season, container.type, data);
    if (!plant || !data || !dates || !isValidDate(dates.start) || !isValidDate(dates.due)) {
      if (task) {
        await this.deleteTask(task._id, true);
      }
      return;
    }

    const { start, due } = dates;

    const completedOn = getPlantedDate(instance);

    if (!task) {
      await this.addTask({
        text: `Plant ${plant.name} in ${container.name} at ${slotTitle}`,
        type: 'Plant',
        start,
        due,
        plantInstanceId: instance._id,
        path,
        completedOn
      });
    } else {
      await this.editTask(
        task._id,
        {
          text: `Plant ${plant.name} in ${container.name} at ${slotTitle}`,
          type: task.type,
          start,
          due,
          plantInstanceId: instance._id,
          path: task.path,
          completedOn
        },
        false
      );
    }
  }

  async createUpdateTransplantedTask(
    season: 'spring' | 'fall',
    container: ContainerDocument,
    instance: PlantInstanceDocument | null,
    plant: PlantDocument | null,
    data: PlantData | undefined,
    path: string,
    slotTitle: string
  ) {
    if (!instance?._id || !container._id) {
      return;
    }

    const task = await this.getTaskByTypeAndPlantInstanceId('Transplant', instance._id);
    const dates = this.getTransplantedStartAndDueDate(season, data, getPlantedDate(instance));
    if (!plant || !data || !dates || !isValidDate(dates.start) || !isValidDate(dates.due)) {
      if (task) {
        await this.deleteTask(task._id, true);
      }
      return;
    }

    const { start, due } = dates;

    const completedOn = findHistoryByStatus(instance, TRANSPLANTED)?.date ?? null;

    if (!task) {
      await this.addTask({
        text: `Transplant ${plant.name} from ${container.name} at ${slotTitle}`,
        type: 'Transplant',
        start,
        due,
        plantInstanceId: instance._id,
        path,
        completedOn
      });
    } else {
      await this.editTask(
        task._id,
        {
          text: `Transplant ${plant.name} from ${container.name} at ${slotTitle}`,
          type: task.type,
          start,
          due,
          plantInstanceId: instance._id,
          path: task.path,
          completedOn
        },
        false
      );
    }
  }

  getHarvestStartAndDueDate(
    plant: PlantDocument | null,
    plantedDate: Date | null
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
    slotId: number,
    subSlot: boolean,
    instance: PlantInstanceDocument | null,
    plant: PlantDocument | null,
    path: string,
    slotTitle: string
  ) {
    if (!instance?._id || !container._id) {
      return;
    }

    const task = await this.getTaskByTypeAndPlantInstanceId('Harvest', instance._id);

    const dates = this.getHarvestStartAndDueDate(plant, getPlantedDate(instance));
    if (
      !plant ||
      instance?.containerId !== container._id ||
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

    let completedOn: Date | null = null;
    if (container._id !== instance.containerId) {
      completedOn =
        findHistoryFrom(
          instance,
          {
            containerId: container._id,
            slotId,
            subSlot
          },
          HARVESTED
        )?.date ?? null;
    }

    if (!task) {
      await this.addTask({
        text: `Harvest ${plant.name} from ${container.name} at ${slotTitle}`,
        type: 'Harvest',
        start,
        due,
        plantInstanceId: instance._id,
        path,
        completedOn
      });
    } else {
      await this.editTask(
        task._id,
        {
          text: `Harvest ${plant.name} from ${container.name} at ${slotTitle}`,
          type: task.type,
          start,
          due,
          plantInstanceId: instance._id,
          path: task.path,
          completedOn
        },
        false
      );
    }
  }

  getFertilizeStartAndDueDate(
    plantedDate: Date | null,
    transplantedDate: Date | null,
    fertilizerApplication: FertilizerApplication,
    previousTask: TaskDocument | null | undefined
  ): { start: Date; due: Date } | undefined {
    const fromDate = fertilizerApplication.from === 'Transplanted' ? transplantedDate : plantedDate;
    if (fromDate) {
      const startDays = fertilizerApplication.start;
      const endDays = fertilizerApplication.end ?? ONE_WEEK;

      if (fertilizerApplication.relative) {
        if (!previousTask || isNullish(previousTask?.completedOn)) {
          return undefined;
        }

        return {
          start: addDays(previousTask.completedOn, startDays),
          due: addDays(addDays(previousTask.completedOn, startDays), endDays)
        };
      }

      return {
        start: addDays(fromDate, startDays),
        due: addDays(addDays(fromDate, startDays), endDays)
      };
    }

    return undefined;
  }

  async createUpdateIndoorFertilzeTasksTask(
    season: 'spring' | 'fall',
    container: ContainerDocument,
    slotId: number,
    subSlot: boolean,
    instance: PlantInstanceDocument | null,
    plant: PlantDocument | null,
    data: PlantData | undefined,
    path: string,
    slotTitle: string
  ) {
    if (!instance?._id || !container._id) {
      return;
    }

    const tasks = await this.getTasksByTypeAndPlantInstanceId('Fertilize', instance._id);
    const taskTexts: string[] = [];
    const tasksByText = tasks.reduce((byText, task) => {
      byText[task.text] = task;
      return byText;
    }, {} as Record<string, TaskDocument>);

    const howToGrowData = data?.howToGrow[season];
    const fertilizeData = container.type === 'Inside' ? howToGrowData?.indoor?.fertilize : howToGrowData?.fertilize;

    if (!plant || !data || fertilizeData === undefined || instance?.containerId !== container._id) {
      if (tasks.length > 0) {
        for (const task of tasks) {
          await this.deleteTask(task._id, true);
        }
      }
      return;
    }

    let previousTask: TaskDocument | null | undefined;

    let i = 0;
    for (const fertilizerApplication of fertilizeData) {
      i += 1;
      const dates = this.getFertilizeStartAndDueDate(
        getPlantedDate(instance),
        getTransplantedDate(instance, {
          containerId: container._id,
          slotId,
          subSlot
        }),
        fertilizerApplication,
        previousTask
      );
      if (!dates || !isValidDate(dates.start) || !isValidDate(dates.due)) {
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
        previousTask = await this.addTask({
          text,
          type: 'Fertilize',
          start,
          due,
          plantInstanceId: instance._id,
          path,
          completedOn: null
        });
      } else if (task.completedOn === null) {
        previousTask = await this.editTask(
          task._id,
          {
            text,
            type: 'Fertilize',
            start,
            due,
            plantInstanceId: instance._id,
            path,
            completedOn: null
          },
          false
        );
      } else {
        previousTask = task;
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
