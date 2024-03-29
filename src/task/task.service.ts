import { BadRequestException, Inject, Injectable, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import addDays from 'date-fns/addDays';
import subDays from 'date-fns/subDays';
import { FilterQuery, Model, UpdateQuery, UpdateWithAggregationPipeline } from 'mongoose';
import { ONE_WEEK, TWO_WEEKS } from '../constants';
import { ContainerService } from '../container/container.service';
import { ContainerDocument } from '../container/interfaces/container.interface';
import growingZoneData from '../data/growingZoneData';
import {
  CONTAINER_TYPE_INSIDE,
  CONTAINER_TYPE_OUTSIDE,
  ContainerType,
  FERTILIZE,
  FertilizerApplication,
  GrowingZoneData,
  HARVEST,
  HARVESTED,
  MATURITY_FROM_TRANSPLANT,
  PLANT,
  PlantData,
  SPRING,
  Season,
  TRANSPLANTED,
  TaskType
} from '../interface';
import { PlantInstanceHistoryDocument } from '../plant-instance/interfaces/plant-instance-history.interface';
import { PlantInstanceDocument } from '../plant-instance/interfaces/plant-instance.interface';
import { PlantInstanceService } from '../plant-instance/plant-instance.service';
import {
  findHistoryFrom,
  getPlantedDate,
  getPlantedEvent,
  getTransplantedDate
} from '../plant-instance/util/history.util';
import { PlantDocument } from '../plant/interfaces/plant.interface';
import { isValidDate } from '../util/date.util';
import { fromTaskTypeToHistoryStatus } from '../util/history.util';
import { isNotNullish, isNullish } from '../util/null.util';
import ordinalSuffixOf from '../util/number.util';
import { isEmpty, isNotEmpty } from '../util/string.util';
import { BulkCompleteTaskDTO, sanitizeBulkCompleteTaskDTO } from './dto/bulk-complete-task.dto';
import { CreateTaskDTO, sanitizeCreateTaskDTO } from './dto/create-task.dto';
import { TaskDocument } from './interfaces/task.interface';

@Injectable()
export class TaskService {
  constructor(
    @InjectModel('Task') private readonly taskModel: Model<TaskDocument>,
    @Inject(forwardRef(() => ContainerService)) private containerService: ContainerService,
    @Inject(forwardRef(() => PlantInstanceService)) private plantInstanceService: PlantInstanceService
  ) {}

  async addTask(createTaskDTO: CreateTaskDTO): Promise<TaskDocument> {
    const newTask = await this.taskModel.create(sanitizeCreateTaskDTO(createTaskDTO));
    return newTask.save();
  }

  async getTaskById(taskId: string): Promise<TaskDocument | null> {
    return await this.taskModel.findById(taskId).exec();
  }

  async getOpenTaskByTypeAndPlantInstanceId(type: TaskType, plantInstanceId: string): Promise<TaskDocument | null> {
    return this.taskModel
      .findOne({ type: { $eq: type }, plantInstanceId: { $eq: plantInstanceId }, completedOn: null })
      .exec();
  }

  async getOpenTasksByTypeAndPlantInstanceId(type: TaskType, plantInstanceId: string): Promise<TaskDocument[]> {
    return this.taskModel
      .find({ type: { $eq: type }, plantInstanceId: { $eq: plantInstanceId }, completedOn: null })
      .exec();
  }

  async getTasksByTypeAndPlantInstanceId(type: TaskType, plantInstanceId: string): Promise<TaskDocument[]> {
    return this.taskModel.find({ type: { $eq: type }, plantInstanceId: { $eq: plantInstanceId } }).exec();
  }

  async getTasks(filter: FilterQuery<TaskDocument> = {}): Promise<TaskDocument[]> {
    return this.taskModel.find(filter).exec();
  }

  async getTasksByPlantInstanceId(plantInstanceId: string): Promise<TaskDocument[]> {
    return this.taskModel.find({ plantInstanceId: { $eq: plantInstanceId } }).exec();
  }

  async copyTasks(originPlantInstanceId: string, targetPlantInstanceId: string) {
    const oldTasks = await this.getTasksByPlantInstanceId(originPlantInstanceId);

    for (const task of oldTasks) {
      await this.addTask({
        text: task.text,
        type: task.type,
        start: task.start,
        due: task.due,
        plantInstanceId: targetPlantInstanceId,
        path: task.path,
        completedOn: task.completedOn
      });
    }
  }

  async editTask(
    taskId: string,
    createTaskDTO: CreateTaskDTO,
    updateContainerTasks: boolean
  ): Promise<TaskDocument | null> {
    const task = await this.taskModel.findByIdAndUpdate(taskId, sanitizeCreateTaskDTO(createTaskDTO), {
      new: true
    });

    if (task?.type === FERTILIZE && updateContainerTasks) {
      const plantInstance = await this.plantInstanceService.getPlantInstance(task.plantInstanceId);
      await this.plantInstanceService.createUpdatePlantInstanceTasks(plantInstance);
    }

    return task;
  }

  async buildCompleteTasks(dto: BulkCompleteTaskDTO): Promise<number> {
    const sanitizedDto = sanitizeBulkCompleteTaskDTO(dto);
    if (!sanitizedDto) {
      return 0;
    }

    const { type, date, taskIds } = sanitizedDto;
    if (type !== FERTILIZE && type !== HARVEST && type !== PLANT) {
      throw new BadRequestException('Unsupported task type');
    }

    let tasksUpdated = 0;
    for (const taskId of taskIds) {
      const task = await this.getTaskById(taskId);
      if (!task) {
        continue;
      }

      let plantInstance = await this.plantInstanceService.getPlantInstance(task.plantInstanceId);
      if (!plantInstance) {
        continue;
      }

      plantInstance = await this.plantInstanceService.addPlantInstanceHistory(plantInstance, {
        status: fromTaskTypeToHistoryStatus(type),
        date,
        from: {
          containerId: plantInstance.containerId,
          slotId: plantInstance.slotId,
          subSlot: plantInstance.subSlot
        }
      });

      await this.findByIdAndUpdate(task._id, {
        completedOn: new Date(date)
      });

      await this.plantInstanceService.createUpdatePlantInstanceTasks(plantInstance);

      tasksUpdated++;
    }

    return tasksUpdated;
  }

  async updatePlantName(plantInstanceId: string, oldName: string, newName: string) {
    const tasks = await this.getTasksByPlantInstanceId(plantInstanceId);

    for (const task of tasks) {
      await this.taskModel.findByIdAndUpdate(
        task._id,
        {
          text: task.text.replaceAll(oldName, newName)
        },
        { new: true }
      );
    }
  }

  async findByIdAndUpdate(
    taskId: string,
    update: UpdateWithAggregationPipeline | UpdateQuery<TaskDocument>
  ): Promise<TaskDocument | null> {
    return this.taskModel.findByIdAndUpdate(taskId, update, { new: true });
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

  getTaskStartDate(season: Season, growingZoneData: GrowingZoneData): Date {
    const today = new Date();

    if (season === SPRING) {
      let year: number = today.getFullYear();
      if (today.getMonth() >= 6) {
        year++;
      }

      return new Date(year, growingZoneData.lastFrost.getMonth(), growingZoneData.lastFrost.getDate());
    }

    let year: number = today.getFullYear();
    if (today.getMonth() > growingZoneData.firstFrost.getMonth()) {
      year++;
    }

    return new Date(year, growingZoneData.firstFrost.getMonth(), growingZoneData.firstFrost.getDate());
  }

  getPlantedStartAndDueDate(
    season: Season,
    type: ContainerType,
    data: PlantData | undefined
  ): { start: Date; due: Date } | undefined {
    const howToGrowData = data?.howToGrow[season];
    const startDate = this.getTaskStartDate(season, growingZoneData);
    if (type === CONTAINER_TYPE_INSIDE && howToGrowData?.indoor) {
      return {
        start: subDays(startDate, howToGrowData.indoor.min),
        due: subDays(startDate, howToGrowData.indoor.max)
      };
    }

    if (type === CONTAINER_TYPE_OUTSIDE && howToGrowData?.outdoor) {
      return {
        start: subDays(startDate, howToGrowData.outdoor.min),
        due: subDays(startDate, howToGrowData.outdoor.max)
      };
    }

    return undefined;
  }

  getTransplantedDays(
    season: Season,
    data: PlantData | undefined,
    plantedDate: Date | null
  ): { start: number; due: number } | undefined {
    const howToGrowData = data?.howToGrow[season];
    if (howToGrowData?.indoor) {
      if (plantedDate) {
        return {
          start: howToGrowData.indoor.transplant_min,
          due: howToGrowData.indoor.transplant_max
        };
      }

      return {
        start: howToGrowData.indoor.min - howToGrowData.indoor.transplant_min,
        due: howToGrowData.indoor.max - howToGrowData.indoor.transplant_max
      };
    }

    return undefined;
  }

  getTransplantedStartAndDueDate(
    season: Season,
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

      const startDate = this.getTaskStartDate(season, growingZoneData);
      return {
        start: subDays(startDate, howToGrowData.indoor.min - howToGrowData.indoor.transplant_min),
        due: subDays(startDate, howToGrowData.indoor.max - howToGrowData.indoor.transplant_max)
      };
    }

    return undefined;
  }

  async createUpdatePlantedTask(
    season: Season,
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

    let tasks = await this.getTasksByTypeAndPlantInstanceId(PLANT, instance._id);
    if (tasks.length > 1) {
      for (const task of tasks) {
        await this.deleteTask(task._id, true);
      }
      tasks = [];
    }

    let task: TaskDocument | undefined = undefined;
    if (tasks.length > 0) {
      task = tasks[0];
    }

    const dates = this.getPlantedStartAndDueDate(season, container.type, data);
    if (
      !plant ||
      !data ||
      !dates ||
      instance.closed ||
      container.archived ||
      !isValidDate(dates.start) ||
      !isValidDate(dates.due)
    ) {
      if (task) {
        await this.deleteTask(task._id, true);
      }
      return;
    }

    const { start, due } = dates;

    const completedOn = getPlantedDate(instance);
    if (task && isNullish(task.completedOn) && instance.closed) {
      await this.deleteTask(task._id, true);
      return;
    }

    if (!task) {
      await this.addTask({
        text: `Plant ${plant.name} in ${container.name} at ${slotTitle}`,
        type: 'Plant',
        start,
        due,
        plantInstanceId: instance._id.toString(),
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
          plantInstanceId: instance._id.toString(),
          path: task.path,
          completedOn
        },
        false
      );
    }
  }

  async createUpdateTransplantedTask(
    season: Season,
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

    let tasks = await this.getOpenTasksByTypeAndPlantInstanceId('Transplant', instance._id);
    if (tasks.length > 1) {
      for (const task of tasks) {
        await this.deleteTask(task._id, true);
      }
      tasks = [];
    }

    let task: TaskDocument | undefined = undefined;
    if (tasks.length > 0) {
      task = tasks[0];
    }

    const dates = this.getTransplantedStartAndDueDate(season, data, getPlantedDate(instance));
    if (
      !plant ||
      !data ||
      !dates ||
      instance.closed ||
      container.archived ||
      !isValidDate(dates.start) ||
      !isValidDate(dates.due) ||
      container.type !== CONTAINER_TYPE_INSIDE
    ) {
      if (task) {
        await this.deleteTask(task._id, true);
      }
      return;
    }

    const { start, due } = dates;

    const completedOn =
      (await this.plantInstanceService.findTransplantedOutsideHistoryByStatus(instance))?.date ?? null;

    if (task && isNullish(task.completedOn) && instance.closed) {
      await this.deleteTask(task._id, true);
      return;
    }

    if (!task) {
      await this.addTask({
        text: `Transplant ${plant.name} from ${container.name} at ${slotTitle}`,
        type: 'Transplant',
        start,
        due,
        plantInstanceId: instance._id.toString(),
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
          plantInstanceId: instance._id.toString(),
          path: task.path,
          completedOn
        },
        false
      );
    }
  }

  getDaysRange(range?: [number | undefined, number | undefined]): [number, number] {
    if (range === undefined) {
      return [0, 0];
    }

    let min = 0;
    if (range.length > 0) {
      min = range[0] ?? 0;
    }

    let max = 0;
    if (range.length > 1) {
      max = range[1] ?? 0;
    }

    if (max === 0) {
      return [min, min];
    }

    return [min, max];
  }

  async getHarvestStartAndDueDate(
    plant: PlantDocument | null,
    plantedEvent: PlantInstanceHistoryDocument | undefined,
    season: Season,
    instance: PlantInstanceDocument | null,
    data: PlantData | undefined,
    transplantedOn?: Date | null
  ): Promise<{ start: Date; due: Date } | undefined> {
    if (isNullish(plantedEvent)) {
      return undefined;
    }

    const plantedContainer = await this.containerService.getContainer(plantedEvent.from?.containerId);

    const [minDaysToGerminate, maxDaysToGerminate] = this.getDaysRange(plant?.daysToGerminate);
    const [minDaysToMaturity, maxDaysToMaturity] = this.getDaysRange(plant?.daysToMaturity);

    let min = minDaysToGerminate + minDaysToMaturity;
    let max = maxDaysToGerminate + maxDaysToMaturity;
    if (plantedContainer?.type !== CONTAINER_TYPE_OUTSIDE && plant?.maturityFrom === MATURITY_FROM_TRANSPLANT) {
      if (isNotNullish(transplantedOn)) {
        if (minDaysToMaturity !== maxDaysToMaturity) {
          return {
            start: addDays(transplantedOn, minDaysToMaturity),
            due: addDays(transplantedOn, maxDaysToMaturity)
          };
        }

        return {
          start: addDays(transplantedOn, minDaysToMaturity),
          due: addDays(transplantedOn, maxDaysToMaturity + TWO_WEEKS)
        };
      }

      const dates = this.getTransplantedDays(season, data, getPlantedDate(instance));
      if (dates) {
        min = dates.start + minDaysToMaturity;
        max = dates.due + maxDaysToMaturity;
      }
    }

    if (min !== max) {
      return {
        start: addDays(plantedEvent.date, min),
        due: addDays(plantedEvent.date, max)
      };
    }

    return {
      start: addDays(plantedEvent.date, min),
      due: addDays(plantedEvent.date, max + TWO_WEEKS)
    };
  }

  async createUpdateHarvestTask(
    season: Season,
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

    let tasks = await this.getTasksByTypeAndPlantInstanceId('Harvest', instance._id);
    if (tasks.length > 1) {
      for (const task of tasks) {
        await this.deleteTask(task._id, true);
      }
      tasks = [];
    }

    let task: TaskDocument | undefined = undefined;
    if (tasks.length > 0) {
      task = tasks[0];
    }

    const transplantedOn =
      (await this.plantInstanceService.findTransplantedOutsideHistoryByStatus(instance))?.date ?? null;

    const dates = await this.getHarvestStartAndDueDate(
      plant,
      getPlantedEvent(instance),
      season,
      instance,
      data,
      transplantedOn
    );
    if (
      !plant ||
      !dates ||
      instance.closed ||
      container.archived ||
      instance?.containerId !== container._id.toString() ||
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
            containerId: container._id.toString(),
            slotId,
            subSlot
          },
          HARVESTED
        )?.date ?? null;
    }

    if (task && isNullish(task.completedOn) && instance.closed) {
      await this.deleteTask(task._id, true);
      return;
    }

    if (!task) {
      await this.addTask({
        text: `Harvest ${plant.name} from ${container.name} at ${slotTitle}`,
        type: 'Harvest',
        start,
        due,
        plantInstanceId: instance._id.toString(),
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
          plantInstanceId: instance._id.toString(),
          path: task.path,
          completedOn
        },
        false
      );
    }
  }

  getFertilizeStartAndDueDate(
    plantedEvent: PlantInstanceHistoryDocument | undefined | null,
    plantedContainer: ContainerDocument | null,
    transplantedDate: Date | null,
    fertilizerApplication: FertilizerApplication,
    previousTask: TaskDocument | null | undefined
  ): { start: Date; due: Date } | undefined {
    let fromDate = plantedEvent?.date ?? null;
    if (fertilizerApplication.from === TRANSPLANTED && plantedContainer?.type === CONTAINER_TYPE_INSIDE) {
      fromDate = transplantedDate;
    }

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

  async createUpdateFertilzeTasks(
    season: Season,
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
    const tasksToDelete: TaskDocument[] = [];
    const tasksByText = tasks.reduce((byText, task) => {
      const key = task.text.replace(/( in [\w\W]+? at Row [0-9]+, Column [0-9]+)/g, '');
      if (key in byText) {
        tasksToDelete.push(task);
        return byText;
      }
      byText[key] = task;
      return byText;
    }, {} as Record<string, TaskDocument>);

    for (const task of tasksToDelete) {
      await this.deleteTask(task._id, true);
    }

    const howToGrowData = data?.howToGrow[season];
    const fertilizeData = container.type === 'Inside' ? howToGrowData?.indoor?.fertilize : howToGrowData?.fertilize;
    const openTasks = await this.getOpenTasksByTypeAndPlantInstanceId('Fertilize', instance._id);
    if (
      !plant ||
      !data ||
      fertilizeData === undefined ||
      instance.closed ||
      container.archived ||
      instance?.containerId !== container._id.toString()
    ) {
      if (openTasks.length > 0) {
        for (const task of openTasks) {
          await this.deleteTask(task._id, true);
        }
      }
      return;
    }

    let previousTask: TaskDocument | null | undefined;

    const plantedEvent = getPlantedEvent(instance);
    const plantedContainer = await this.containerService.getContainer(plantedEvent?.to?.containerId);

    let i = 0;
    for (const fertilizerApplication of fertilizeData) {
      i += 1;
      const dates = this.getFertilizeStartAndDueDate(
        plantedEvent,
        plantedContainer,
        getTransplantedDate(instance, {
          containerId: container._id.toString(),
          slotId,
          subSlot
        }),
        fertilizerApplication,
        previousTask
      );
      if (!dates || !isValidDate(dates.start) || !isValidDate(dates.due)) {
        previousTask = null;
        continue;
      }

      const { start, due } = dates;

      let text: string;
      if (fertilizeData.length > 1 && isEmpty(fertilizerApplication.description)) {
        text = `Fertilize (${ordinalSuffixOf(i)} time) ${plant.name}`;
      } else if (isNotEmpty(fertilizerApplication.description)) {
        text = `Fertilize ${plant.name} (${fertilizerApplication.description})`;
      } else {
        text = `Fertilize ${plant.name}`;
      }

      const task = tasksByText[text];
      if (task && isNullish(task.completedOn) && instance.closed) {
        previousTask = null;
        await this.deleteTask(task._id, true);
        continue;
      }

      taskTexts.push(text);
      if (!task) {
        previousTask = await this.addTask({
          text: `${text} in ${container.name} at ${slotTitle}`,
          type: 'Fertilize',
          start,
          due,
          plantInstanceId: instance._id.toString(),
          path,
          completedOn: null
        });
      } else if (task.completedOn === null) {
        previousTask = await this.editTask(
          task._id,
          {
            text: `${text} in ${container.name} at ${slotTitle}`,
            type: 'Fertilize',
            start,
            due,
            plantInstanceId: instance._id.toString(),
            path,
            completedOn: null
          },
          false
        );
      } else {
        previousTask = task;
      }
    }

    if (!instance.closed) {
      for (const task of tasks) {
        if (taskTexts.includes(task.text.replace(/( in [\w\W]+? at Row [0-9]+, Column [0-9]+)/g, ''))) {
          continue;
        }

        await this.deleteTask(task._id, true);
      }
    }
  }
}
