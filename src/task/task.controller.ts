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
  Query,
} from '@nestjs/common';
import { TaskService } from './task.service';
import { CreateTaskDTO } from './dto/create-task.dto';
import { ValidateObjectId } from '../shared/pipes/validate-object-id.pipes';

@Controller('/api/task')
export class TaskController {
  constructor(private taskService: TaskService) {}

  // Submit a task
  @Post('')
  async addTask(@Res() res, @Body() createTaskDTO: CreateTaskDTO) {
    const newTask = await this.taskService.addTask(createTaskDTO);
    return res.status(HttpStatus.OK).json(newTask);
  }

  // Fetch a particular task using ID
  @Get('/:taskId')
  async getTask(@Res() res, @Param('taskId', new ValidateObjectId()) taskId) {
    const task = await this.taskService.getTaskById(taskId);
    if (!task) {
      throw new NotFoundException('Task does not exist!');
    }
    return res.status(HttpStatus.OK).json(task);
  }

  // Fetch all tasks
  @Get('')
  async getTasks(@Res() res, @Query('path') path) {
    const tasks = path
      ? await this.taskService.getTasksByPath(path)
      : await this.taskService.getTasks();
    return res.status(HttpStatus.OK).json(tasks);
  }

  // Edit a particular task using ID
  @Put('/:taskId')
  async editTask(
    @Res() res,
    @Param('taskId', new ValidateObjectId()) taskId,
    @Body() createTaskDTO: CreateTaskDTO,
  ) {
    const editedTask = await this.taskService.editTask(taskId, createTaskDTO);
    if (!editedTask) {
      throw new NotFoundException('Task does not exist!');
    }
    return res.status(HttpStatus.OK).json(editedTask);
  }

  // Delete a task using ID
  @Delete('/:taskId')
  async deleteTask(
    @Res() res,
    @Param('taskId', new ValidateObjectId()) taskId,
  ) {
    const deletedTask = await this.taskService.deleteTask(taskId);
    if (!deletedTask) {
      throw new NotFoundException('Task does not exist!');
    }
    return res.status(HttpStatus.OK).json(deletedTask);
  }
}
