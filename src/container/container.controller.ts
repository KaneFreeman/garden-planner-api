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
  Res,
  UseGuards
} from '@nestjs/common';
import { Response } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { toTaskType } from '../interface';
import { ValidateObjectId } from '../shared/pipes/validate-object-id.pipes';
import { ContainerService } from './container.service';
import { ContainerTaskUpdateDTO } from './dto/container-task-update.dto';
import { ContainerDTO } from './dto/container.dto';

@Controller('/api/container')
export class ContainerController {
  constructor(private containerService: ContainerService) {}

  // Submit a container
  @UseGuards(AuthGuard)
  @Post('')
  async addContainer(@Res() res: Response, @Body() createContainerDTO: ContainerDTO) {
    const newContainer = await this.containerService.addContainer(createContainerDTO);
    return res.status(HttpStatus.OK).json(newContainer);
  }

  // Fetch a particular container using ID
  @UseGuards(AuthGuard)
  @Get('/:containerId')
  async getContainer(@Res() res: Response, @Param('containerId', new ValidateObjectId()) containerId: string) {
    const container = await this.containerService.getContainer(containerId);
    if (!container) {
      throw new NotFoundException('Container does not exist!');
    }
    return res.status(HttpStatus.OK).json(container);
  }

  // Fetch all containers
  @UseGuards(AuthGuard)
  @Get('')
  async getContainers(@Res() res: Response) {
    const containers = await this.containerService.getContainers();
    return res.status(HttpStatus.OK).json(containers);
  }

  // Edit a particular container using ID
  @UseGuards(AuthGuard)
  @Put('/:containerId')
  async editContainer(
    @Res() res: Response,
    @Param('containerId', new ValidateObjectId()) containerId: string,
    @Body() createContainerDTO: ContainerDTO
  ) {
    const editedContainer = await this.containerService.editContainer(containerId, createContainerDTO, true);
    if (!editedContainer) {
      throw new NotFoundException('Container does not exist!');
    }
    return res.status(HttpStatus.OK).json(editedContainer);
  }

  // Delete a container using ID
  @UseGuards(AuthGuard)
  @Delete('/:containerId')
  async deleteContainer(@Res() res: Response, @Param('containerId', new ValidateObjectId()) containerId: string) {
    const deletedContainer = await this.containerService.deleteContainer(containerId);
    if (!deletedContainer) {
      throw new NotFoundException('Container does not exist!');
    }
    return res.status(HttpStatus.OK).json(deletedContainer);
  }

  // Update tasks in a container
  @UseGuards(AuthGuard)
  @Post('/:containerId/:taskType')
  async fertilizeContainer(
    @Res() res: Response,
    @Param('containerId', new ValidateObjectId()) containerId: string,
    @Param('taskType') rawTaskType: string,
    @Body() containerFertilizeDTO: ContainerTaskUpdateDTO
  ) {
    const taskType = toTaskType(rawTaskType);
    if (!taskType) {
      return res.status(HttpStatus.BAD_REQUEST).json({ error: 'Task type does not exist!' });
    }

    const updatedTasksCount = await this.containerService.updateContainerTasksByType(
      containerId,
      containerFertilizeDTO.date,
      taskType,
      containerFertilizeDTO.plantInstanceIds
    );
    return res.status(HttpStatus.OK).json(updatedTasksCount);
  }
}
