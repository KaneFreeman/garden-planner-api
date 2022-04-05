import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreateTaskDTO } from './dto/create-task.dto';
import { Task } from './interfaces/task.interface';

@Injectable()
export class TaskService {
  constructor(@InjectModel('Task') private readonly taskModel: Model<Task>) {}

  async addTask(createTaskDTO: CreateTaskDTO): Promise<Task> {
    const newTask = await this.taskModel.create(createTaskDTO);
    return newTask.save();
  }

  async getTask(taskId): Promise<Task> {
    const task = await this.taskModel.findById(taskId).exec();
    return task;
  }

  async getTasks(): Promise<Task[]> {
    const tasks = await this.taskModel.find().exec();
    return tasks;
  }

  async editTask(taskId, createTaskDTO: CreateTaskDTO): Promise<Task> {
    const editedTask = await this.taskModel.findByIdAndUpdate(
      taskId,
      createTaskDTO,
      { new: true },
    );
    return editedTask;
  }

  async deleteTask(taskId): Promise<Task> {
    const deletedTask = await this.taskModel.findByIdAndRemove(taskId);
    return deletedTask;
  }
}
