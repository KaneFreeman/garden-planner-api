import { BadRequestException, Inject, Injectable, Logger, NotFoundException, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { addDays, subDays } from 'date-fns';
import { Model, PipelineStage, Types, UpdateQuery, UpdateWithAggregationPipeline } from 'mongoose';
import { ONE_WEEK, TWO_WEEKS } from '../../constants';
import { ContainerService } from '../../container/container.service';
import { ContainerProjection } from '../../container/interfaces/container.projection';
import {
  CONTAINER_TYPE_INSIDE,
  CONTAINER_TYPE_OUTSIDE,
  ContainerType,
  FERTILIZE,
  FERTILIZED,
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
} from '../../interface';
import { PlantInstanceHistoryDocument } from '../../plant-instance/interfaces/plant-instance-history.document';
import { PlantInstanceProjection } from '../../plant-instance/interfaces/plant-instance.projection';
import { PlantInstanceService } from '../../plant-instance/plant-instance.service';
import {
  findHistoryFrom,
  getPlantedDate,
  getPlantedEvent,
  getTransplantedDate
} from '../../plant-instance/util/history.util';
import { PlantProjection } from '../../plant/interfaces/plant.projection';
import { UserService } from '../../users/user.service';
import { isValidDate } from '../../util/date.util';
import { hasFrostDates } from '../../util/growingZone.util';
import { fromTaskTypeToHistoryStatus } from '../../util/history.util';
import { isNotNullish, isNullish } from '../../util/null.util';
import ordinalSuffixOf from '../../util/number.util';
import { getPlantTitle } from '../../util/plant.util';
import { isEmpty, isNotEmpty } from '../../util/string.util';
import { BulkCompleteTaskDTO, sanitizeBulkCompleteTaskDTO } from '../dto/bulk-complete-task.dto';
import { CreateTaskDTO, sanitizeCreateTaskDTO } from '../dto/create-task.dto';
import { TaskDocument } from '../interfaces/task.document';
import { TaskProjection } from '../interfaces/task.projection';

@Injectable()
export class TaskService {
  constructor(
    private logger: Logger,
    @InjectModel('Task') private readonly taskModel: Model<TaskDocument>,
    @Inject(forwardRef(() => ContainerService)) private containerService: ContainerService,
    @Inject(forwardRef(() => PlantInstanceService)) private plantInstanceService: PlantInstanceService,
    @Inject(forwardRef(() => UserService)) private userService: UserService
  ) {}

  async addTask(createTaskDTO: CreateTaskDTO, userId: string, gardenId: string): Promise<TaskProjection> {
    const sanitizedCreateTaskDTO = sanitizeCreateTaskDTO(createTaskDTO);

    if (isNotNullish(sanitizedCreateTaskDTO.plantInstanceId)) {
      const plantInstance = await this.plantInstanceService.getPlantInstance(
        sanitizedCreateTaskDTO.plantInstanceId,
        userId,
        gardenId
      );

      if (!plantInstance) {
        throw new NotFoundException('Plant instance does not exist!');
      }
    }

    const newTask = await this.taskModel.create({
      ...sanitizedCreateTaskDTO,
      plantInstanceId: sanitizedCreateTaskDTO.plantInstanceId
        ? new Types.ObjectId(sanitizedCreateTaskDTO.plantInstanceId)
        : null,
      gardenId: new Types.ObjectId(gardenId)
    });
    return newTask.save();
  }

  async findTasks(userId: string, gardenId: string, extraPipeline: PipelineStage[] = []): Promise<TaskProjection[]> {
    const tasks = await this.taskModel
      .aggregate<TaskProjection>([
        {
          $match: {
            gardenId: new Types.ObjectId(gardenId)
          }
        },
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
          $lookup: {
            from: 'plantinstances',
            localField: 'plantInstanceId',
            foreignField: '_id',
            as: 'plantInstance'
          }
        },
        {
          $unwind: {
            path: '$plantInstance',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $match: {
            'garden.userId': new Types.ObjectId(userId),
            $or: [{ plantInstance: { $ne: null } }, { type: 'Custom' }]
          }
        },
        ...extraPipeline,
        {
          $project: {
            _id: 1,
            text: 1,
            type: 1,
            start: 1,
            due: 1,
            plantInstanceId: 1,
            path: 1,
            completedOn: 1
          }
        }
      ])
      .exec();

    return tasks;
  }

  async getTask(taskId: string | null | undefined, userId: string, gardenId: string): Promise<TaskProjection | null> {
    if (!taskId || !gardenId) {
      return null;
    }

    const task = await this.findTasks(userId, gardenId, [
      {
        $match: {
          _id: new Types.ObjectId(taskId)
        }
      }
    ]);

    if (task.length === 0) {
      return null;
    }

    return task[0];
  }

  async findTask(
    userId: string,
    gardenId: string,
    extraPipeline: PipelineStage[] = []
  ): Promise<TaskProjection | null> {
    const task = await this.findTasks(userId, gardenId, extraPipeline);

    if (task.length === 0) {
      return null;
    }

    return task[0];
  }

  async getOpenTaskByTypeAndPlantInstanceId(
    type: TaskType,
    plantInstanceId: string,
    userId: string,
    gardenId: string
  ): Promise<TaskProjection | null> {
    return this.findTask(userId, gardenId, [
      {
        $match: {
          type: { $eq: type },
          plantInstanceId: { $eq: plantInstanceId },
          completedOn: null
        }
      }
    ]);
  }

  async getOpenTasksByTypeAndPlantInstanceId(
    type: TaskType,
    plantInstanceId: string,
    userId: string,
    gardenId: string
  ): Promise<TaskProjection[]> {
    return this.findTasks(userId, gardenId, [
      {
        $match: {
          type: { $eq: type },
          plantInstanceId: { $eq: plantInstanceId },
          completedOn: null
        }
      }
    ]);
  }

  async getTasksByTypeAndPlantInstanceId(
    type: TaskType,
    plantInstanceId: string,
    userId: string,
    gardenId: string
  ): Promise<TaskProjection[]> {
    return this.findTasks(userId, gardenId, [
      {
        $match: {
          type: { $eq: type },
          plantInstanceId: { $eq: plantInstanceId }
        }
      }
    ]);
  }

  async getTasksByPlantInstanceId(
    plantInstanceId: string,
    userId: string,
    gardenId: string
  ): Promise<TaskProjection[]> {
    return this.findTasks(userId, gardenId, [
      {
        $match: {
          plantInstanceId: { $eq: plantInstanceId }
        }
      }
    ]);
  }

  async copyTasks(originPlantInstanceId: string, targetPlantInstanceId: string, userId: string, gardenId: string) {
    const oldTasks = await this.getTasksByPlantInstanceId(originPlantInstanceId, userId, gardenId);

    for (const task of oldTasks) {
      await this.addTask(
        {
          text: task.text,
          type: task.type,
          start: task.start,
          due: task.due,
          plantInstanceId: targetPlantInstanceId,
          path: task.path,
          completedOn: task.completedOn
        },
        userId,
        gardenId
      );
    }
  }

  async editTask(
    taskId: string,
    userId: string,
    gardenId: string,
    createTaskDTO: CreateTaskDTO,
    updateContainerTasks: boolean
  ): Promise<TaskProjection | null> {
    const oldTask = await this.getTask(taskId, userId, gardenId);
    if (!oldTask) {
      throw new NotFoundException('Task does not exist!');
    }

    const sanitizedCreateTaskDTO = sanitizeCreateTaskDTO(createTaskDTO);

    const task = await this.taskModel.findByIdAndUpdate(
      taskId,
      {
        ...sanitizedCreateTaskDTO,
        plantInstanceId: sanitizedCreateTaskDTO.plantInstanceId
          ? new Types.ObjectId(sanitizedCreateTaskDTO.plantInstanceId)
          : null,
        gardenId: new Types.ObjectId(gardenId)
      },
      {
        new: true
      }
    );

    if (task?.type === FERTILIZE && updateContainerTasks) {
      const plantInstance = await this.plantInstanceService.getPlantInstance(task.plantInstanceId, userId, gardenId);

      const growingZoneData = await this.userService.getGrowingZoneData(userId);
      if (growingZoneData) {
        await this.plantInstanceService.createUpdatePlantInstanceTasks(
          plantInstance,
          userId,
          gardenId,
          growingZoneData
        );
      }
    }

    return task;
  }

  async buildCompleteTasks(dto: BulkCompleteTaskDTO, userId: string, gardenId: string): Promise<number> {
    const sanitizedDto = sanitizeBulkCompleteTaskDTO(dto);
    if (!sanitizedDto) {
      return 0;
    }

    const { type, date, taskIds } = sanitizedDto;
    if (type !== FERTILIZE && type !== HARVEST && type !== PLANT) {
      throw new BadRequestException('Unsupported task type');
    }

    const growingZoneData = await this.userService.getGrowingZoneData(userId);

    let tasksUpdated = 0;
    for (const taskId of taskIds) {
      const task = await this.getTask(taskId, userId, gardenId);
      if (!task) {
        continue;
      }

      let plantInstance = await this.plantInstanceService.getPlantInstance(task.plantInstanceId, userId, gardenId);
      if (!plantInstance) {
        continue;
      }

      plantInstance = await this.plantInstanceService.addPlantInstanceHistory(plantInstance, {
        status: fromTaskTypeToHistoryStatus(type),
        date,
        from: {
          containerId: plantInstance.containerId,
          slotId: plantInstance.slotId
        }
      });

      await this.findByIdAndUpdate(task._id, userId, gardenId, {
        completedOn: new Date(date)
      });

      if (growingZoneData) {
        await this.plantInstanceService.createUpdatePlantInstanceTasks(
          plantInstance,
          userId,
          gardenId,
          growingZoneData
        );
      }

      tasksUpdated++;
    }

    return tasksUpdated;
  }

  async updatePlantName(plantInstanceId: string, userId: string, gardenId: string, oldName: string, newName: string) {
    const tasks = await this.getTasksByPlantInstanceId(plantInstanceId, userId, gardenId);

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
    userId: string,
    gardenId: string,
    update: UpdateWithAggregationPipeline | UpdateQuery<TaskDocument>
  ): Promise<TaskProjection | null> {
    const oldTask = await this.getTask(taskId, userId, gardenId);
    if (!oldTask) {
      throw new NotFoundException('Task does not exist!');
    }

    return this.taskModel.findByIdAndUpdate(taskId, update, { new: true });
  }

  async deleteTask(taskId: string, userId: string, gardenId: string, force = false): Promise<TaskProjection | null> {
    const task = await this.getTask(taskId, userId, gardenId);
    if (!force && task?.type !== 'Custom') {
      return null;
    }

    return await this.taskModel.findByIdAndDelete(taskId);
  }

  async deleteOpenTasksByPlantInstance(plantInstanceId: string, userId: string, gardenId: string): Promise<void> {
    const plantInstance = await this.plantInstanceService.getPlantInstance(plantInstanceId, userId, gardenId);
    if (!plantInstance) {
      throw new NotFoundException('Plant instance does not exist!');
    }

    await this.taskModel.deleteMany({ plantInstanceId, completedOn: null }).exec();
  }

  async deleteOrphanedTasks(): Promise<void> {
    const tasks = await this.taskModel
      .aggregate<TaskProjection>([
        {
          $lookup: {
            from: 'plantinstances',
            localField: 'plantInstanceId',
            foreignField: '_id',
            as: 'plantInstance'
          }
        },
        {
          $unwind: {
            path: '$plantInstance',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $match: {
            plantInstance: null,
            type: {
              $ne: 'Custom'
            }
          }
        },
        {
          $project: {
            _id: 1,
            text: 1,
            type: 1,
            start: 1,
            due: 1,
            plantInstanceId: 1,
            path: 1,
            completedOn: 1
          }
        }
      ])
      .exec();

    for (const task of tasks) {
      await this.taskModel.findByIdAndDelete(task._id);
    }
  }

  getTaskStartDate(season: Season, growingZoneData: Required<GrowingZoneData>): Date {
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
    data: PlantData | undefined,
    growingZoneData: GrowingZoneData
  ): { start: Date; due: Date } | undefined {
    const howToGrowData = data?.howToGrow[season];

    if (hasFrostDates(growingZoneData)) {
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
    plantedDate: Date | null,
    growingZoneData: GrowingZoneData
  ): { start: Date; due: Date } | undefined {
    const howToGrowData = data?.howToGrow[season];
    if (howToGrowData?.indoor) {
      if (plantedDate) {
        return {
          start: addDays(plantedDate, howToGrowData.indoor.transplant_min),
          due: addDays(plantedDate, howToGrowData.indoor.transplant_max)
        };
      }

      if (hasFrostDates(growingZoneData)) {
        const startDate = this.getTaskStartDate(season, growingZoneData);
        return {
          start: subDays(startDate, howToGrowData.indoor.min - howToGrowData.indoor.transplant_min),
          due: subDays(startDate, howToGrowData.indoor.max - howToGrowData.indoor.transplant_max)
        };
      }
    }

    return undefined;
  }

  async createUpdatePlantedTask(
    userId: string,
    gardenId: string,
    season: Season,
    container: ContainerProjection,
    instance: PlantInstanceProjection | null,
    plant: PlantProjection | null,
    data: PlantData | undefined,
    growingZoneData: GrowingZoneData,
    path: string
  ) {
    if (!instance?._id || !container._id) {
      return;
    }

    let tasks = await this.getTasksByTypeAndPlantInstanceId(PLANT, instance._id, userId, gardenId);
    if (tasks.length > 1) {
      for (const task of tasks) {
        await this.deleteTask(task._id, userId, gardenId, true);
      }
      tasks = [];
    }

    let task: TaskProjection | undefined = undefined;
    if (tasks.length > 0) {
      task = tasks[0];
    }

    const dates = this.getPlantedStartAndDueDate(season, container.type, data, growingZoneData);
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
        await this.deleteTask(task._id, userId, gardenId, true);
      }
      return;
    }

    const { start, due } = dates;

    const completedOn = getPlantedDate(instance);
    if (task && isNullish(task.completedOn) && instance.closed) {
      await this.deleteTask(task._id, userId, gardenId, true);
      return;
    }

    if (!task) {
      await this.addTask(
        {
          text: `Plant ${getPlantTitle(plant)} in ${container.name}`,
          type: 'Plant',
          start,
          due,
          plantInstanceId: instance._id.toString(),
          path,
          completedOn
        },
        userId,
        gardenId
      );
    } else {
      await this.editTask(
        task._id,
        userId,
        gardenId,
        {
          text: `Plant ${getPlantTitle(plant)} in ${container.name}`,
          type: task.type,
          start,
          due,
          plantInstanceId: instance._id.toString(),
          path,
          completedOn
        },
        false
      );
    }
  }

  async createUpdateTransplantedTask(
    userId: string,
    gardenId: string,
    season: Season,
    container: ContainerProjection,
    instance: PlantInstanceProjection | null,
    plant: PlantProjection | null,
    data: PlantData | undefined,
    growingZoneData: GrowingZoneData,
    path: string
  ) {
    if (!instance?._id || !container._id) {
      return;
    }

    let tasks = await this.getOpenTasksByTypeAndPlantInstanceId('Transplant', instance._id, userId, gardenId);
    if (tasks.length > 1) {
      for (const task of tasks) {
        await this.deleteTask(task._id, userId, gardenId, true);
      }
      tasks = [];
    }

    let task: TaskProjection | undefined = undefined;
    if (tasks.length > 0) {
      task = tasks[0];
    }

    const dates = this.getTransplantedStartAndDueDate(season, data, getPlantedDate(instance), growingZoneData);
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
        await this.deleteTask(task._id, userId, gardenId, true);
      }
      return;
    }

    const { start, due } = dates;

    const completedOn =
      (await this.plantInstanceService.findTransplantedOutsideHistoryByStatus(instance, userId, gardenId))?.date ??
      null;

    if (task && isNullish(task.completedOn) && instance.closed) {
      await this.deleteTask(task._id, userId, gardenId, true);
      return;
    }

    if (!task) {
      await this.addTask(
        {
          text: `Transplant ${getPlantTitle(plant)} from ${container.name}`,
          type: 'Transplant',
          start,
          due,
          plantInstanceId: instance._id,
          path,
          completedOn
        },
        userId,
        gardenId
      );
    } else {
      await this.editTask(
        task._id,
        userId,
        gardenId,
        {
          text: `Transplant ${getPlantTitle(plant)} from ${container.name}`,
          type: task.type,
          start,
          due,
          plantInstanceId: instance._id.toString(),
          path,
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
    userId: string,
    gardenId: string,
    plant: PlantProjection | null,
    plantedEvent: PlantInstanceHistoryDocument | undefined,
    season: Season,
    instance: PlantInstanceProjection | null,
    data: PlantData | undefined,
    transplantedOn?: Date | null
  ): Promise<{ start: Date; due: Date } | undefined> {
    if (isNullish(plantedEvent)) {
      return undefined;
    }

    const plantedContainer = await this.containerService.getContainer(plantedEvent.from?.containerId, userId, gardenId);

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
    userId: string,
    gardenId: string,
    season: Season,
    container: ContainerProjection,
    slotId: number,
    instance: PlantInstanceProjection | null,
    plant: PlantProjection | null,
    data: PlantData | undefined,
    path: string
  ) {
    if (!instance?._id || !container._id) {
      return;
    }

    let tasks = await this.getTasksByTypeAndPlantInstanceId('Harvest', instance._id, userId, gardenId);
    if (tasks.length > 1) {
      for (const task of tasks) {
        await this.deleteTask(task._id, userId, gardenId, true);
      }
      tasks = [];
    }

    let task: TaskProjection | undefined = undefined;
    if (tasks.length > 0) {
      task = tasks[0];
    }

    const transplantedOn =
      (await this.plantInstanceService.findTransplantedOutsideHistoryByStatus(instance, userId, gardenId))?.date ??
      null;

    const dates = await this.getHarvestStartAndDueDate(
      userId,
      gardenId,
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
      instance?.containerId.toString() !== container._id.toString() ||
      !isValidDate(dates.start) ||
      !isValidDate(dates.due) ||
      data?.harvestable === false
    ) {
      if (task) {
        await this.deleteTask(task._id, userId, gardenId, true);
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
            slotId
          },
          HARVESTED
        )?.date ?? null;
    }

    if (task && isNullish(task.completedOn) && instance.closed) {
      await this.deleteTask(task._id, userId, gardenId, true);
      return;
    }

    if (!task) {
      await this.addTask(
        {
          text: `Harvest ${getPlantTitle(plant)} from ${container.name}`,
          type: 'Harvest',
          start,
          due,
          plantInstanceId: instance._id.toString(),
          path,
          completedOn
        },
        userId,
        gardenId
      );
    } else {
      await this.editTask(
        task._id,
        userId,
        gardenId,
        {
          text: `Harvest ${getPlantTitle(plant)} from ${container.name}`,
          type: task.type,
          start,
          due,
          plantInstanceId: instance._id.toString(),
          path,
          completedOn
        },
        false
      );
    }
  }

  getFertilizeStartAndDueDate(
    plantedEvent: PlantInstanceHistoryDocument | undefined | null,
    plantedContainer: ContainerProjection | null,
    transplantedDate: Date | null,
    fertilizerApplication: FertilizerApplication,
    previousTask: TaskProjection | null | undefined
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
    userId: string,
    gardenId: string,
    season: Season,
    container: ContainerProjection,
    slotId: number,
    instance: PlantInstanceProjection | null,
    plant: PlantProjection | null,
    data: PlantData | undefined,
    path: string
  ) {
    if (!instance?._id || !container._id) {
      return;
    }

    const tasks = await this.getTasksByTypeAndPlantInstanceId('Fertilize', instance._id, userId, gardenId);

    const taskTexts: string[] = [];
    const tasksToDelete: TaskProjection[] = [];
    const tasksByText = tasks.reduce(
      (byText, task) => {
        const key = task.text.replace(/( in [\w\W]+?)/g, '');
        if (key in byText) {
          tasksToDelete.push(task);
          return byText;
        }
        byText[key] = task;
        return byText;
      },
      {} as Record<string, TaskProjection>
    );

    for (const task of tasksToDelete) {
      await this.deleteTask(task._id, userId, gardenId, true);
    }

    const howToGrowData = data?.howToGrow[season];
    const fertilizeData = container.type === 'Inside' ? howToGrowData?.indoor?.fertilize : howToGrowData?.fertilize;
    const openTasks = await this.getOpenTasksByTypeAndPlantInstanceId('Fertilize', instance._id, userId, gardenId);
    if (
      !plant ||
      !data ||
      fertilizeData === undefined ||
      instance.closed ||
      container.archived ||
      instance?.containerId.toString() !== container._id.toString()
    ) {
      if (openTasks.length > 0) {
        for (const task of openTasks) {
          await this.deleteTask(task._id, userId, gardenId, true);
        }
      }
      return;
    }

    let previousTask: TaskProjection | null | undefined;

    const plantedEvent = getPlantedEvent(instance);
    const plantedContainer = await this.containerService.getContainer(plantedEvent?.to?.containerId, userId, gardenId);

    const fertilizedDatesInCurrentContainer = (instance.history ?? [])
      .filter((entry) => entry.from?.containerId.toString() === container._id.toString() && entry.status === FERTILIZED)
      .map((entry) => entry.date);

    let i = 0;
    for (const fertilizerApplication of fertilizeData) {
      i += 1;
      const dates = this.getFertilizeStartAndDueDate(
        plantedEvent,
        plantedContainer,
        getTransplantedDate(instance, {
          containerId: container._id.toString(),
          slotId
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
        text = `Fertilize (${ordinalSuffixOf(i)} time) ${getPlantTitle(plant)}`;
      } else if (isNotEmpty(fertilizerApplication.description)) {
        text = `Fertilize ${getPlantTitle(plant)} (${fertilizerApplication.description})`;
      } else {
        text = `Fertilize ${getPlantTitle(plant)}`;
      }

      const task = tasksByText[text];
      if (task && isNullish(task.completedOn) && instance.closed) {
        previousTask = null;
        await this.deleteTask(task._id, userId, gardenId, true);
        continue;
      }

      const completedOn =
        fertilizedDatesInCurrentContainer.length >= i ? fertilizedDatesInCurrentContainer[i - 1] : null;

      taskTexts.push(text);
      if (!task) {
        previousTask = await this.addTask(
          {
            text: `${text} in ${container.name}`,
            type: 'Fertilize',
            start,
            due,
            plantInstanceId: instance._id.toString(),
            path,
            completedOn
          },
          userId,
          gardenId
        );
      } else if (task.completedOn === null) {
        previousTask = await this.editTask(
          task._id,
          userId,
          gardenId,
          {
            text: `${text} in ${container.name}`,
            type: 'Fertilize',
            start,
            due,
            plantInstanceId: instance._id.toString(),
            path,
            completedOn
          },
          false
        );
      } else {
        previousTask = task;
      }
    }

    if (!instance.closed) {
      for (const task of tasks) {
        if (taskTexts.includes(task.text.replace(/( in [\w\W]+?)/g, ''))) {
          continue;
        }

        await this.deleteTask(task._id, userId, gardenId, true);
      }
    }
  }
}
