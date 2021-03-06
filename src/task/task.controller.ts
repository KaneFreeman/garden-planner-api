import {
  Controller,
  Get,
  Res,
  HttpStatus,
  Param,
  NotFoundException,
  Post,
  Body,
  Put,
  Delete,
  Query
} from '@nestjs/common';
import { Response } from 'express';
import { TaskService } from './task.service';
import { CreateTaskDTO } from './dto/create-task.dto';
import { ValidateObjectId } from '../shared/pipes/validate-object-id.pipes';
import { BulkCompleteTaskDTO } from './dto/bulk-complete-task.dto';

@Controller('/api/task')
export class TaskController {
  constructor(private taskService: TaskService) {}

  // Submit a task
  @Post('')
  async addTask(@Res() res: Response, @Body() createTaskDTO: CreateTaskDTO) {
    const newTask = await this.taskService.addTask(createTaskDTO);
    return res.status(HttpStatus.OK).json(newTask);
  }

  // Fetch a particular task using ID
  @Get('/:taskId')
  async getTask(@Res() res: Response, @Param('taskId', new ValidateObjectId()) taskId: string) {
    const task = await this.taskService.getTaskById(taskId);
    if (!task) {
      throw new NotFoundException('Task does not exist!');
    }
    return res.status(HttpStatus.OK).json(task);
  }

  // Fetch all tasks
  @Get('')
  async getTasks(@Res() res: Response, @Query('plantInstanceId') plantInstanceId: string) {
    const tasks = plantInstanceId
      ? await this.taskService.getTasksByPlantInstanceId(plantInstanceId)
      : await this.taskService.getTasks();
    return res.status(HttpStatus.OK).json(tasks);
  }

  // Bulk complete tasks
  @Put('/bulk-complete')
  async bulkCompleteTask(@Res() res: Response, @Body() dto: BulkCompleteTaskDTO) {
    const tasksCompleted = await this.taskService.buildCompleteTasks(dto);
    return res.status(HttpStatus.OK).json(tasksCompleted);
  }

  // Edit a particular task using ID
  @Put('/:taskId')
  async editTask(
    @Res() res: Response,
    @Param('taskId', new ValidateObjectId()) taskId: string,
    @Body() createTaskDTO: CreateTaskDTO
  ) {
    const editedTask = await this.taskService.editTask(taskId, createTaskDTO, true);
    if (!editedTask) {
      throw new NotFoundException('Task does not exist!');
    }
    return res.status(HttpStatus.OK).json(editedTask);
  }

  // Delete a task using ID
  @Delete('/:taskId')
  async deleteTask(@Res() res: Response, @Param('taskId', new ValidateObjectId()) taskId: string) {
    const deletedTask = await this.taskService.deleteTask(taskId);
    if (!deletedTask) {
      throw new NotFoundException('Task does not exist!');
    }
    return res.status(HttpStatus.OK).json(deletedTask);
  }
}
