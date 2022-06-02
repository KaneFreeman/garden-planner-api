import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { TaskType } from '../interface';
import { TaskDocument } from './interfaces/task.interface';

@Injectable()
export class OldTaskService {
  constructor(@InjectModel('old-task') private readonly taskModel: Model<TaskDocument>) {}

  async getTaskById(taskId: string): Promise<TaskDocument | null> {
    return await this.taskModel.findById(taskId).exec();
  }

  async getTaskByTypeAndPath(type: TaskType, path: string): Promise<TaskDocument | null> {
    return this.taskModel.findOne({ type: { $eq: type }, path: { $eq: path } }).exec();
  }

  async getTasksByTypeAndPath(type: TaskType, path: string): Promise<TaskDocument[]> {
    return this.taskModel.find({ type: { $eq: type }, path: { $eq: path } }).exec();
  }

  async getTasks(): Promise<TaskDocument[]> {
    return this.taskModel.find().exec();
  }

  async getTasksByPath(path: string): Promise<TaskDocument[]> {
    return this.taskModel.find({ path: { $eq: path } }).exec();
  }
}
