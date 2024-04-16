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
  Req,
  Res,
  UseGuards
} from '@nestjs/common';
import { Response } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { RequestWithUser } from '../auth/dto/requestWithUser';
import { ValidateObjectId } from '../shared/pipes/validate-object-id.pipes';
import { BulkCompleteTaskDTO } from './dto/bulk-complete-task.dto';
import { CreateTaskDTO } from './dto/create-task.dto';
import { TaskService } from './task.service';

@Controller('/api/garden/:gardenId/task')
export class TaskController {
  constructor(private taskService: TaskService) {}

  // Submit a task
  @UseGuards(AuthGuard)
  @Post('')
  async addTask(
    @Req() req: RequestWithUser,
    @Res() res: Response,
    @Body() createTaskDTO: CreateTaskDTO,
    @Param('gardenId', new ValidateObjectId()) gardenId: string
  ) {
    const newTask = await this.taskService.addTask(createTaskDTO, req.user.userId, gardenId);
    return res.status(HttpStatus.OK).json(newTask);
  }

  // Fetch a particular task using ID
  @UseGuards(AuthGuard)
  @Get('/:taskId')
  async getTask(
    @Req() req: RequestWithUser,
    @Res() res: Response,
    @Param('gardenId', new ValidateObjectId()) gardenId: string,
    @Param('taskId', new ValidateObjectId()) taskId: string
  ) {
    const task = await this.taskService.getTask(taskId, req.user.userId, gardenId);
    if (!task) {
      throw new NotFoundException('Task does not exist!');
    }
    return res.status(HttpStatus.OK).json(task);
  }

  // Fetch all tasks
  @UseGuards(AuthGuard)
  @Get('')
  async getTasks(
    @Req() req: RequestWithUser,
    @Res() res: Response,
    @Param('gardenId', new ValidateObjectId()) gardenId: string,
    @Query('plantInstanceId') plantInstanceId: string
  ) {
    const tasks = plantInstanceId
      ? await this.taskService.getTasksByPlantInstanceId(plantInstanceId, req.user.userId, gardenId)
      : await this.taskService.findTasks(req.user.userId, gardenId);
    return res.status(HttpStatus.OK).json(tasks);
  }

  // Bulk complete tasks
  @UseGuards(AuthGuard)
  @Put('/bulk-complete')
  async bulkCompleteTask(
    @Req() req: RequestWithUser,
    @Res() res: Response,
    @Param('gardenId', new ValidateObjectId()) gardenId: string,
    @Body() dto: BulkCompleteTaskDTO
  ) {
    const tasksCompleted = await this.taskService.buildCompleteTasks(dto, req.user.userId, gardenId);
    return res.status(HttpStatus.OK).json(tasksCompleted);
  }

  // Edit a particular task using ID
  @UseGuards(AuthGuard)
  @Put('/:taskId')
  async editTask(
    @Req() req: RequestWithUser,
    @Res() res: Response,
    @Param('gardenId', new ValidateObjectId()) gardenId: string,
    @Param('taskId', new ValidateObjectId()) taskId: string,
    @Body() createTaskDTO: CreateTaskDTO
  ) {
    const editedTask = await this.taskService.editTask(taskId, req.user.userId, gardenId, createTaskDTO, true);
    if (!editedTask) {
      throw new NotFoundException('Task does not exist!');
    }
    return res.status(HttpStatus.OK).json(editedTask);
  }

  // Delete a task using ID
  @UseGuards(AuthGuard)
  @Delete('/:taskId')
  async deleteTask(
    @Req() req: RequestWithUser,
    @Res() res: Response,
    @Param('gardenId', new ValidateObjectId()) gardenId: string,
    @Param('taskId', new ValidateObjectId()) taskId: string
  ) {
    const deletedTask = await this.taskService.deleteTask(taskId, req.user.userId, gardenId);
    if (!deletedTask) {
      throw new NotFoundException('Task does not exist!');
    }
    return res.status(HttpStatus.OK).json(deletedTask);
  }
}
