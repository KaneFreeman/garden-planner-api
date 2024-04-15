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
import { FERTILIZE, FERTILIZED, HARVEST, HARVESTED } from '../interface';
import { ValidateObjectId } from '../shared/pipes/validate-object-id.pipes';
import { BulkReopenClosePlantInstanceDTO } from './dto/bulk-reopen-close-plant-instance.dto';
import { PlantInstanceAddHistoryAndUpdateTaskDTO } from './dto/plant-instance-add-history-and-update-task.dto';
import { PlantInstanceDTO } from './dto/plant-instance.dto';
import { PlantInstanceService } from './plant-instance.service';

@Controller('/api/garden/:gardenId/plant-instance')
export class PlantInstanceController {
  constructor(private plantInstanceService: PlantInstanceService) {}

  // Submit a PlantInstance
  @UseGuards(AuthGuard)
  @Post('')
  async addPlantInstance(
    @Req() req: RequestWithUser,
    @Res() res: Response,
    @Query('copiedFromId') copiedFromId: string,
    @Param('gardenId', new ValidateObjectId()) gardenId: string,
    @Body() createPlantInstanceDTO: PlantInstanceDTO
  ) {
    const newPlantInstance = await this.plantInstanceService.addPlantInstance(
      createPlantInstanceDTO,
      req.user.userId,
      gardenId,
      {
        copiedFromId
      }
    );
    return res.status(HttpStatus.OK).json(newPlantInstance);
  }

  // Fetch a particular PlantInstance using ID
  @UseGuards(AuthGuard)
  @Get('/:plantInstanceId')
  async getPlantInstance(
    @Req() req: RequestWithUser,
    @Res() res: Response,
    @Param('gardenId', new ValidateObjectId()) gardenId: string,
    @Param('plantInstanceId', new ValidateObjectId()) plantInstanceId: string
  ) {
    const plantInstance = await this.plantInstanceService.getPlantInstance(plantInstanceId, req.user.userId, gardenId);
    if (!plantInstance) {
      throw new NotFoundException('PlantInstance does not exist!');
    }
    return res.status(HttpStatus.OK).json(plantInstance);
  }

  // Fetch all PlantInstances
  @UseGuards(AuthGuard)
  @Get('')
  async getPlantInstances(
    @Req() req: RequestWithUser,
    @Res() res: Response,
    @Param('gardenId', new ValidateObjectId()) gardenId: string
  ) {
    const PlantInstances = await this.plantInstanceService.getPlantInstances(req.user.userId, gardenId);
    return res.status(HttpStatus.OK).json(PlantInstances);
  }

  // Edit a particular PlantInstance using ID
  @UseGuards(AuthGuard)
  @Put('/:plantInstanceId')
  async editPlantInstance(
    @Req() req: RequestWithUser,
    @Res() res: Response,
    @Param('gardenId', new ValidateObjectId()) gardenId: string,
    @Param('plantInstanceId', new ValidateObjectId()) plantInstanceId: string,
    @Body() createPlantInstanceDTO: PlantInstanceDTO
  ) {
    const editedPlantInstance = await this.plantInstanceService.editPlantInstance(
      plantInstanceId,
      req.user.userId,
      gardenId,
      createPlantInstanceDTO
    );
    if (!editedPlantInstance) {
      throw new NotFoundException('PlantInstance does not exist!');
    }
    return res.status(HttpStatus.OK).json(editedPlantInstance);
  }

  // Delete a PlantInstance using ID
  @UseGuards(AuthGuard)
  @Delete('/:plantInstanceId')
  async deletePlantInstance(
    @Req() req: RequestWithUser,
    @Res() res: Response,
    @Param('gardenId', new ValidateObjectId()) gardenId: string,
    @Param('plantInstanceId', new ValidateObjectId()) plantInstanceId: string
  ) {
    const deletedPlantInstance = await this.plantInstanceService.deletePlantInstance(
      plantInstanceId,
      req.user.userId,
      gardenId
    );
    if (!deletedPlantInstance) {
      throw new NotFoundException('PlantInstance does not exist!');
    }
    return res.status(HttpStatus.OK).json(deletedPlantInstance);
  }

  // Fertilize a plant instance
  @UseGuards(AuthGuard)
  @Post('/:plantInstanceId/fertilize')
  async fertilizePlantInstance(
    @Req() req: RequestWithUser,
    @Res() res: Response,
    @Param('gardenId', new ValidateObjectId()) gardenId: string,
    @Param('plantInstanceId', new ValidateObjectId()) plantInstanceId: string,
    @Body() dto: PlantInstanceAddHistoryAndUpdateTaskDTO
  ) {
    const updatedPlantInstance = await this.plantInstanceService.addPlantInstanceHistoryAndUpdateTask(
      plantInstanceId,
      req.user.userId,
      gardenId,
      FERTILIZED,
      FERTILIZE,
      dto.date
    );

    return res.status(HttpStatus.OK).json(updatedPlantInstance);
  }

  // Fertilize a plant instance
  @UseGuards(AuthGuard)
  @Post('/:plantInstanceId/harvest')
  async harvestPlantInstance(
    @Req() req: RequestWithUser,
    @Res() res: Response,
    @Param('gardenId', new ValidateObjectId()) gardenId: string,
    @Param('plantInstanceId', new ValidateObjectId()) plantInstanceId: string,
    @Body() dto: PlantInstanceAddHistoryAndUpdateTaskDTO
  ) {
    const updatedPlantInstance = await this.plantInstanceService.addPlantInstanceHistoryAndUpdateTask(
      plantInstanceId,
      req.user.userId,
      gardenId,
      HARVESTED,
      HARVEST,
      dto.date
    );

    return res.status(HttpStatus.OK).json(updatedPlantInstance);
  }

  // Fertilize a plant instance
  @UseGuards(AuthGuard)
  @Post('/bulk-reopen-close')
  async bulkReopenClose(
    @Req() req: RequestWithUser,
    @Res() res: Response,
    @Param('gardenId', new ValidateObjectId()) gardenId: string,
    @Body() dto: BulkReopenClosePlantInstanceDTO
  ) {
    const updatedPlantInstances = await this.plantInstanceService.bulkReopenClosePlantInstances(
      dto,
      req.user.userId,
      gardenId
    );

    return res.status(HttpStatus.OK).json(updatedPlantInstances);
  }
}
