import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  Res,
  UseGuards
} from '@nestjs/common';
import { Response } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { ValidateObjectId } from '../shared/pipes/validate-object-id.pipes';
import { BulkCompleteTaskDTO } from './dto/bulk-complete-task.dto';
import { CreateTaskDTO } from './dto/create-task.dto';
import { TaskService } from './task.service';

@Controller('/api/task')
export class TaskController {
  constructor(private taskService: TaskService) {}

  // Submit a task
  @UseGuards(AuthGuard)
  @Post('')
  async addTask(@Res() res: Response, @Body() createTaskDTO: CreateTaskDTO) {
    const newTask = await this.taskService.addTask(createTaskDTO);
    return res.status(HttpStatus.OK).json(newTask);
  }

  // Fetch a particular task using ID
  @UseGuards(AuthGuard)
  @Get('/:taskId')
  async getTask(@Res() res: Response, @Param('taskId', new ValidateObjectId()) taskId: string) {
    const task = await this.taskService.getTaskById(taskId);
    if (!task) {
      throw new NotFoundException('Task does not exist!');
    }
    return res.status(HttpStatus.OK).json(task);
  }

  // Fetch all tasks
  @UseGuards(AuthGuard)
  @Get('')
  async getTasks(@Res() res: Response, @Query('plantInstanceId') plantInstanceId: string) {
    const tasks = plantInstanceId
      ? await this.taskService.getTasksByPlantInstanceId(plantInstanceId)
      : await this.taskService.getTasks();
    return res.status(HttpStatus.OK).json(tasks);
  }

  // Bulk complete tasks
  @UseGuards(AuthGuard)
  @Put('/bulk-complete')
  async bulkCompleteTask(@Res() res: Response, @Body() dto: BulkCompleteTaskDTO) {
    const tasksCompleted = await this.taskService.buildCompleteTasks(dto);
    return res.status(HttpStatus.OK).json(tasksCompleted);
  }

  // Edit a particular task using ID
  @UseGuards(AuthGuard)
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
  @UseGuards(AuthGuard)
  @Delete('/:taskId')
  async deleteTask(@Res() res: Response, @Param('taskId', new ValidateObjectId()) taskId: string) {
    const deletedTask = await this.taskService.deleteTask(taskId);
    if (!deletedTask) {
      throw new NotFoundException('Task does not exist!');
    }
    return res.status(HttpStatus.OK).json(deletedTask);
  }
}
