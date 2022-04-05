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
import { PlantService } from './plant.service';
import { PlantDTO } from './dto/plant.dto';
import { ValidateObjectId } from '../shared/pipes/validate-object-id.pipes';

@Controller('plant')
export class PlantController {
  constructor(private plantService: PlantService) {}

  // Submit a plant
  @Post('')
  async addPlant(@Res() res, @Body() createPlantDTO: PlantDTO) {
    const newPlant = await this.plantService.addPlant(createPlantDTO);
    return res.status(HttpStatus.OK).json(newPlant);
  }

  // Fetch a particular plant using ID
  @Get('/:plantId')
  async getPlant(
    @Res() res,
    @Param('plantId', new ValidateObjectId()) plantId,
  ) {
    const plant = await this.plantService.getPlant(plantId);
    if (!plant) {
      throw new NotFoundException('Plant does not exist!');
    }
    return res.status(HttpStatus.OK).json(plant);
  }

  // Fetch all plants
  @Get('')
  async getPlants(@Res() res) {
    const plants = await this.plantService.getPlants();
    return res.status(HttpStatus.OK).json(plants);
  }

  // Edit a particular plant using ID
  @Put('/:plantId')
  async editPlant(
    @Res() res,
    @Param('plantId', new ValidateObjectId()) plantId,
    @Body() createPlantDTO: PlantDTO,
  ) {
    const editedPlant = await this.plantService.editPlant(
      plantId,
      createPlantDTO,
    );
    if (!editedPlant) {
      throw new NotFoundException('Plant does not exist!');
    }
    return res.status(HttpStatus.OK).json(editedPlant);
  }

  // Delete a plant using ID
  @Delete('/:plantId')
  async deletePlant(
    @Res() res,
    @Param('plantId', new ValidateObjectId()) plantId,
  ) {
    const deletedPlant = await this.plantService.deletePlant(plantId);
    if (!deletedPlant) {
      throw new NotFoundException('Plant does not exist!');
    }
    return res.status(HttpStatus.OK).json(deletedPlant);
  }
}
