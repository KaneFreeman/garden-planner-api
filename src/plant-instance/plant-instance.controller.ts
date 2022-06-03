import { Controller, Get, Res, HttpStatus, Param, NotFoundException, Post, Body, Put, Delete } from '@nestjs/common';
import { Response } from 'express';
import { ValidateObjectId } from '../shared/pipes/validate-object-id.pipes';
import { PlantInstanceService } from './plant-instance.service';
import { PlantInstanceDTO } from './dto/plant-instance.dto';
import { PlantInstanceAddHistoryAndUpdateTaskDTO } from './dto/plant-instance-add-history-and-update-task.dto';
import { FERTILIZE, FERTILIZED, HARVEST, HARVESTED } from '../interface';

@Controller('/api/plant-instance')
export class PlantInstanceController {
  constructor(private plantInstanceService: PlantInstanceService) {}

  // Submit a PlantInstance
  @Post('')
  async addPlantInstance(@Res() res: Response, @Body() createPlantInstanceDTO: PlantInstanceDTO) {
    const newPlantInstance = await this.plantInstanceService.addPlantInstance(createPlantInstanceDTO);
    return res.status(HttpStatus.OK).json(newPlantInstance);
  }

  // Fetch a particular PlantInstance using ID
  @Get('/:plantInstanceId')
  async getPlantInstance(
    @Res() res: Response,
    @Param('plantInstanceId', new ValidateObjectId()) plantInstanceId: string
  ) {
    const plantInstance = await this.plantInstanceService.getPlantInstance(plantInstanceId);
    if (!plantInstance) {
      throw new NotFoundException('PlantInstance does not exist!');
    }
    return res.status(HttpStatus.OK).json(plantInstance);
  }

  // Fetch all PlantInstances
  @Get('')
  async getPlantInstances(@Res() res: Response) {
    const PlantInstances = await this.plantInstanceService.getPlantInstances();
    return res.status(HttpStatus.OK).json(PlantInstances);
  }

  // Edit a particular PlantInstance using ID
  @Put('/:plantInstanceId')
  async editPlantInstance(
    @Res() res: Response,
    @Param('plantInstanceId', new ValidateObjectId()) plantInstanceId: string,
    @Body() createPlantInstanceDTO: PlantInstanceDTO
  ) {
    const editedPlantInstance = await this.plantInstanceService.editPlantInstance(
      plantInstanceId,
      createPlantInstanceDTO
    );
    if (!editedPlantInstance) {
      throw new NotFoundException('PlantInstance does not exist!');
    }
    return res.status(HttpStatus.OK).json(editedPlantInstance);
  }

  // Delete a PlantInstance using ID
  @Delete('/:plantInstanceId')
  async deletePlantInstance(
    @Res() res: Response,
    @Param('plantInstanceId', new ValidateObjectId()) plantInstanceId: string
  ) {
    const deletedPlantInstance = await this.plantInstanceService.deletePlantInstance(plantInstanceId);
    if (!deletedPlantInstance) {
      throw new NotFoundException('PlantInstance does not exist!');
    }
    return res.status(HttpStatus.OK).json(deletedPlantInstance);
  }

  // Fertilize a plant instance
  @Post('/:plantInstanceId/fertilize')
  async fertilizePlantInstance(
    @Res() res: Response,
    @Param('plantInstanceId', new ValidateObjectId()) plantInstanceId: string,
    @Body() dto: PlantInstanceAddHistoryAndUpdateTaskDTO
  ) {
    const updatedPlantInstance = await this.plantInstanceService.addPlantInstanceHistoryAndUpdateTask(
      plantInstanceId,
      FERTILIZED,
      FERTILIZE,
      dto.date
    );

    return res.status(HttpStatus.OK).json(updatedPlantInstance);
  }

  // Fertilize a plant instance
  @Post('/:plantInstanceId/harvest')
  async harvestPlantInstance(
    @Res() res: Response,
    @Param('plantInstanceId', new ValidateObjectId()) plantInstanceId: string,
    @Body() dto: PlantInstanceAddHistoryAndUpdateTaskDTO
  ) {
    const updatedPlantInstance = await this.plantInstanceService.addPlantInstanceHistoryAndUpdateTask(
      plantInstanceId,
      HARVESTED,
      HARVEST,
      dto.date
    );

    return res.status(HttpStatus.OK).json(updatedPlantInstance);
  }
}
