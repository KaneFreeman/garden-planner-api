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
} from '@nestjs/common';
import { ContainerService } from './container.service';
import { ContainerDTO } from './dto/container.dto';
import { ValidateObjectId } from '../shared/pipes/validate-object-id.pipes';

@Controller('container')
export class ContainerController {
  constructor(private containerService: ContainerService) {}

  // Submit a container
  @Post('')
  async addContainer(@Res() res, @Body() createContainerDTO: ContainerDTO) {
    const newContainer = await this.containerService.addContainer(
      createContainerDTO,
    );
    return res.status(HttpStatus.OK).json(newContainer);
  }

  // Fetch a particular container using ID
  @Get('/:containerId')
  async getContainer(
    @Res() res,
    @Param('containerId', new ValidateObjectId()) containerId,
  ) {
    const container = await this.containerService.getContainer(containerId);
    if (!container) {
      throw new NotFoundException('Container does not exist!');
    }
    return res.status(HttpStatus.OK).json(container);
  }

  // Fetch all containers
  @Get('')
  async getContainers(@Res() res) {
    const containers = await this.containerService.getContainers();
    return res.status(HttpStatus.OK).json(containers);
  }

  // Edit a particular container using ID
  @Put('/:containerId')
  async editContainer(
    @Res() res,
    @Param('containerId', new ValidateObjectId()) containerId,
    @Body() createContainerDTO: ContainerDTO,
  ) {
    const editedContainer = await this.containerService.editContainer(
      containerId,
      createContainerDTO,
    );
    if (!editedContainer) {
      throw new NotFoundException('Container does not exist!');
    }
    return res.status(HttpStatus.OK).json(editedContainer);
  }

  // Delete a container using ID
  @Delete('/:containerId')
  async deleteContainer(
    @Res() res,
    @Param('containerId', new ValidateObjectId()) containerId,
  ) {
    const deletedContainer = await this.containerService.deleteContainer(
      containerId,
    );
    if (!deletedContainer) {
      throw new NotFoundException('Container does not exist!');
    }
    return res.status(HttpStatus.OK).json(deletedContainer);
  }
}
