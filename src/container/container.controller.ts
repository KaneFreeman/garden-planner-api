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
  Req,
  Res,
  UseGuards
} from '@nestjs/common';
import { Response } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { RequestWithUser } from '../auth/dto/requestWithUser';
import { toTaskType } from '../interface';
import { ValidateObjectId } from '../shared/pipes/validate-object-id.pipes';
import { ContainerService } from './container.service';
import { ContainerPlanSlotDTO } from './dto/container-plan-slot.dto';
import { ContainerTaskUpdateDTO } from './dto/container-task-update.dto';
import { ContainerDTO } from './dto/container.dto';

@Controller('/api/garden/:gardenId/container')
export class ContainerController {
  constructor(private containerService: ContainerService) {}

  // Submit a container
  @UseGuards(AuthGuard)
  @Post('')
  async addContainer(
    @Req() req: RequestWithUser,
    @Res() res: Response,
    @Param('gardenId', new ValidateObjectId()) gardenId: string,
    @Body() createContainerDTO: ContainerDTO
  ) {
    const newContainer = await this.containerService.addContainer(createContainerDTO, req.user.userId, gardenId);
    return res.status(HttpStatus.OK).json(newContainer);
  }

  // Fetch a particular container using ID
  @UseGuards(AuthGuard)
  @Get('/:containerId')
  async getContainer(
    @Req() req: RequestWithUser,
    @Res() res: Response,
    @Param('gardenId', new ValidateObjectId()) gardenId: string,
    @Param('containerId', new ValidateObjectId()) containerId: string
  ) {
    const container = await this.containerService.getContainer(containerId, req.user.userId, gardenId);
    if (!container) {
      throw new NotFoundException('Container does not exist!');
    }
    return res.status(HttpStatus.OK).json(container);
  }

  // Fetch all containers
  @UseGuards(AuthGuard)
  @Get('')
  async getContainers(
    @Req() req: RequestWithUser,
    @Res() res: Response,
    @Param('gardenId', new ValidateObjectId()) gardenId: string
  ) {
    const containers = await this.containerService.getContainers(req.user.userId, gardenId);
    return res.status(HttpStatus.OK).json(containers);
  }

  // Edit a particular container using ID
  @UseGuards(AuthGuard)
  @Put('/:containerId')
  async editContainer(
    @Req() req: RequestWithUser,
    @Res() res: Response,
    @Param('gardenId', new ValidateObjectId()) gardenId: string,
    @Param('containerId', new ValidateObjectId()) containerId: string,
    @Body() createContainerDTO: ContainerDTO
  ) {
    const editedContainer = await this.containerService.editContainer(
      containerId,
      req.user.userId,
      gardenId,
      createContainerDTO,
      true
    );
    if (!editedContainer) {
      throw new NotFoundException('Container does not exist!');
    }
    return res.status(HttpStatus.OK).json(editedContainer);
  }

  // Delete a container using ID
  @UseGuards(AuthGuard)
  @Delete('/:containerId')
  async deleteContainer(
    @Req() req: RequestWithUser,
    @Res() res: Response,
    @Param('gardenId', new ValidateObjectId()) gardenId: string,
    @Param('containerId', new ValidateObjectId()) containerId: string
  ) {
    const deletedContainer = await this.containerService.deleteContainer(containerId, req.user.userId, gardenId);
    if (!deletedContainer) {
      throw new NotFoundException('Container does not exist!');
    }
    return res.status(HttpStatus.OK).json(deletedContainer);
  }

  // Finish planning entire container
  @UseGuards(AuthGuard)
  @Post('/:containerId/finish-planning')
  async finishPlanningContainer(
    @Req() req: RequestWithUser,
    @Res() res: Response,
    @Param('gardenId', new ValidateObjectId()) gardenId: string,
    @Param('containerId', new ValidateObjectId()) containerId: string
  ) {
    const plantInstancesCreatedCount = await this.containerService.finishPlanningContainer(
      containerId,
      req.user.userId,
      gardenId
    );
    return res.status(HttpStatus.OK).json(plantInstancesCreatedCount);
  }

  @UseGuards(AuthGuard)
  @Post('/:containerId/plan-slot')
  async planContainerSlot(
    @Req() req: RequestWithUser,
    @Res() res: Response,
    @Param('gardenId', new ValidateObjectId()) gardenId: string,
    @Param('containerId', new ValidateObjectId()) containerId: string,
    @Body() dto: ContainerPlanSlotDTO
  ) {
    const updatedPlantInstance = await this.containerService.planContainerSlot(
      containerId,
      req.user.userId,
      gardenId,
      dto
    );

    return res.status(HttpStatus.OK).json(updatedPlantInstance);
  }

  // Update tasks in a container
  @UseGuards(AuthGuard)
  @Post('/:containerId/:taskType')
  async updateContainerPlantsByTaskType(
    @Req() req: RequestWithUser,
    @Res() res: Response,
    @Param('gardenId', new ValidateObjectId()) gardenId: string,
    @Param('containerId', new ValidateObjectId()) containerId: string,
    @Param('taskType') rawTaskType: string,
    @Body() containerFertilizeDTO: ContainerTaskUpdateDTO
  ) {
    const taskType = toTaskType(rawTaskType);
    if (!taskType) {
      return res.status(HttpStatus.BAD_REQUEST).json({ error: 'Task type does not exist!' });
    }

    const updatedTasksCount = await this.containerService.updateContainerPlantsByTaskType(
      containerId,
      req.user.userId,
      gardenId,
      containerFertilizeDTO.date,
      taskType,
      containerFertilizeDTO.plantInstanceIds
    );
    return res.status(HttpStatus.OK).json(updatedTasksCount);
  }
}
