import { Controller, Get, Res, HttpStatus, Param, NotFoundException, Post, Body, Put, Delete } from '@nestjs/common';
import { ContainerService } from './container.service';
import { ContainerDTO } from './dto/container.dto';
import { ValidateObjectId } from '../shared/pipes/validate-object-id.pipes';
import { Response } from 'express';
import { ContainerFertilizeDTO } from './dto/container-fertilize.dto';

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
    const editedContainer = await this.containerService.editContainer(containerId, createContainerDTO);
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

  // Fertilize a container
  @Post('/:containerId/fertilize')
  async fertilizeContainer(
    @Res() res: Response,
    @Param('containerId', new ValidateObjectId()) containerId: string,
    @Body() containerFertilizeDTO: ContainerFertilizeDTO
  ) {
    const updatedTasksCount = await this.containerService.fertilizeContainer(containerId, containerFertilizeDTO);
    return res.status(HttpStatus.OK).json(updatedTasksCount);
  }
}
