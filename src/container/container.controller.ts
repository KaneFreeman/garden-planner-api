import { Controller, Get, Res, HttpStatus, Param, NotFoundException, Post, Body, Put, Delete } from '@nestjs/common';
import { ContainerService } from './container.service';
import { ContainerDTO } from './dto/container.dto';
import { ValidateObjectId } from '../shared/pipes/validate-object-id.pipes';
import { Response } from 'express';
import { ContainerTaskUpdateDTO } from './dto/container-task-update.dto';
import { toTaskType } from '../interface';

@Controller('/api/container')
export class ContainerController {
  constructor(private containerService: ContainerService) {}

  // Submit a container
  @Post('')
  async addContainer(@Res() res: Response, @Body() createContainerDTO: ContainerDTO) {
    const newContainer = await this.containerService.addContainer(createContainerDTO);
    return res.status(HttpStatus.OK).json(newContainer);
  }

  // Fetch a particular container using ID
  @Get('/:containerId')
  async getContainer(@Res() res: Response, @Param('containerId', new ValidateObjectId()) containerId: string) {
    const container = await this.containerService.getContainer(containerId);
    if (!container) {
      throw new NotFoundException('Container does not exist!');
    }
    return res.status(HttpStatus.OK).json(container);
  }

  // Fetch all containers
  @Get('')
  async getContainers(@Res() res: Response) {
    const containers = await this.containerService.getContainers();
    return res.status(HttpStatus.OK).json(containers);
  }

  // Edit a particular container using ID
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
  @Delete('/:containerId')
  async deleteContainer(@Res() res: Response, @Param('containerId', new ValidateObjectId()) containerId: string) {
    const deletedContainer = await this.containerService.deleteContainer(containerId);
    if (!deletedContainer) {
      throw new NotFoundException('Container does not exist!');
    }
    return res.status(HttpStatus.OK).json(deletedContainer);
  }

  // Update tasks in a container
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
      taskType
    );
    return res.status(HttpStatus.OK).json(updatedTasksCount);
  }
}
