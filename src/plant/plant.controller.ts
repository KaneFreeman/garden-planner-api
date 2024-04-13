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
import { ValidateObjectId } from '../shared/pipes/validate-object-id.pipes';
import { PlantDTO } from './dto/plant.dto';
import { PlantService } from './plant.service';

@Controller('api/plant')
export class PlantController {
  constructor(private plantService: PlantService) {}

  // Submit a plant
  @UseGuards(AuthGuard)
  @Post('')
  async addPlant(@Res() res: Response, @Body() createPlantDTO: PlantDTO) {
    const newPlant = await this.plantService.addPlant(createPlantDTO);
    return res.status(HttpStatus.OK).json(newPlant);
  }

  // Fetch a particular plant using ID
  @UseGuards(AuthGuard)
  @Get('/:plantId')
  async getPlant(@Res() res: Response, @Param('plantId', new ValidateObjectId()) plantId: string) {
    const plant = await this.plantService.getPlant(plantId);
    if (!plant) {
      throw new NotFoundException('Plant does not exist!');
    }
    return res.status(HttpStatus.OK).json(plant);
  }

  // Fetch all plants
  @UseGuards(AuthGuard)
  @Get('')
  async getPlants(@Res() res: Response) {
    const plants = await this.plantService.getPlants();
    return res.status(HttpStatus.OK).json(plants);
  }

  // Edit a particular plant using ID
  @UseGuards(AuthGuard)
  @Put('/:plantId')
  async editPlant(
    @Res() res: Response,
    @Param('plantId', new ValidateObjectId()) plantId: string,
    @Body() createPlantDTO: PlantDTO
  ) {
    const editedPlant = await this.plantService.editPlant(plantId, createPlantDTO);
    if (!editedPlant) {
      throw new NotFoundException('Plant does not exist!');
    }
    return res.status(HttpStatus.OK).json(editedPlant);
  }

  // Delete a plant using ID
  @UseGuards(AuthGuard)
  @Delete('/:plantId')
  async deletePlant(@Res() res: Response, @Param('plantId', new ValidateObjectId()) plantId: string) {
    const deletedPlant = await this.plantService.deletePlant(plantId);
    if (!deletedPlant) {
      throw new NotFoundException('Plant does not exist!');
    }
    return res.status(HttpStatus.OK).json(deletedPlant);
  }
}
