import { Body, Controller, Delete, Get, HttpStatus, NotFoundException, Param, Post, Put, Res } from '@nestjs/common';
import { Response } from 'express';
import { FERTILIZE, FERTILIZED, HARVEST, HARVESTED } from '../interface';
import { ValidateObjectId } from '../shared/pipes/validate-object-id.pipes';
import { BulkReopenClosePlantInstanceDTO } from './dto/bulk-reopen-close-plant-instance.dto';
import { PlantInstanceAddHistoryAndUpdateTaskDTO } from './dto/plant-instance-add-history-and-update-task.dto';
import { PlantInstanceDTO } from './dto/plant-instance.dto';
import { PlantInstanceService } from './plant-instance.service';

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

  // Fertilize a plant instance
  @Post('/bulk-reopen-close')
  async bulkReopenClose(@Res() res: Response, @Body() dto: BulkReopenClosePlantInstanceDTO) {
    const updatedPlantInstances = await this.plantInstanceService.bulkReopenClosePlantInstances(dto);

    return res.status(HttpStatus.OK).json(updatedPlantInstances);
  }
}
