import { Controller, Get, Res, HttpStatus, Param, NotFoundException, Post, Body, Put, Delete } from '@nestjs/common';
import { PlantInstanceService } from './plant-instance.service';
import { PlantInstanceDTO } from './dto/plant-instance.dto';
import { ValidateObjectId } from '../shared/pipes/validate-object-id.pipes';
import { Response } from 'express';
// import { PlantInstanceFertilizeDTO } from './dto/plant-instance-fertilize.dto';

@Controller('/api/PlantInstance')
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
    const PlantInstance = await this.plantInstanceService.getPlantInstance(plantInstanceId);
    if (!PlantInstance) {
      throw new NotFoundException('PlantInstance does not exist!');
    }
    return res.status(HttpStatus.OK).json(PlantInstance);
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

  // TODO Fertilize a PlantInstance
  // @Post('/:plantInstanceId/fertilize')
  // async fertilizePlantInstance(
  //   @Res() res: Response,
  //   @Param('plantInstanceId', new ValidateObjectId()) plantInstanceId: string,
  //   @Body() PlantInstanceFertilizeDTO: PlantInstanceFertilizeDTO
  // ) {
  //   const updatedTasksCount = await this.plantInstanceService.fertilizePlantInstance(
  //     plantInstanceId,
  //     PlantInstanceFertilizeDTO
  //   );
  //   return res.status(HttpStatus.OK).json(updatedTasksCount);
  // }
}
