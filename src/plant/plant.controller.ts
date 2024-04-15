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
import { ValidateObjectId } from '../shared/pipes/validate-object-id.pipes';
import { PlantDTO } from './dto/plant.dto';
import { PlantService } from './plant.service';
import { RequestWithUser } from '../auth/dto/requestWithUser';

@Controller('api/plant')
export class PlantController {
  constructor(private plantService: PlantService) {}

  // Submit a plant
  @UseGuards(AuthGuard)
  @Post('')
  async addPlant(@Req() req: RequestWithUser, @Res() res: Response, @Body() createPlantDTO: PlantDTO) {
    const newPlant = await this.plantService.addPlant(createPlantDTO, req.user.userId);
    return res.status(HttpStatus.OK).json(newPlant);
  }

  // Fetch a particular plant using ID
  @UseGuards(AuthGuard)
  @Get('/:plantId')
  async getPlant(
    @Req() req: RequestWithUser,
    @Res() res: Response,
    @Param('plantId', new ValidateObjectId()) plantId: string
  ) {
    const plant = await this.plantService.getPlant(plantId, req.user.userId);
    if (!plant) {
      throw new NotFoundException('Plant does not exist!');
    }
    return res.status(HttpStatus.OK).json(plant);
  }

  // Fetch all plants
  @UseGuards(AuthGuard)
  @Get('')
  async getPlants(@Req() req: RequestWithUser, @Res() res: Response) {
    const plants = await this.plantService.getPlants(req.user.userId);
    return res.status(HttpStatus.OK).json(plants);
  }

  // Edit a particular plant using ID
  @UseGuards(AuthGuard)
  @Put('/:plantId')
  async editPlant(
    @Req() req: RequestWithUser,
    @Res() res: Response,
    @Param('plantId', new ValidateObjectId()) plantId: string,
    @Body() createPlantDTO: PlantDTO
  ) {
    const editedPlant = await this.plantService.editPlant(plantId, req.user.userId, createPlantDTO);
    if (!editedPlant) {
      throw new NotFoundException('Plant does not exist!');
    }
    return res.status(HttpStatus.OK).json(editedPlant);
  }

  // Delete a plant using ID
  @UseGuards(AuthGuard)
  @Delete('/:plantId')
  async deletePlant(
    @Req() req: RequestWithUser,
    @Res() res: Response,
    @Param('plantId', new ValidateObjectId()) plantId: string
  ) {
    const deletedPlant = await this.plantService.deletePlant(plantId, req.user.userId);
    if (!deletedPlant) {
      throw new NotFoundException('Plant does not exist!');
    }
    return res.status(HttpStatus.OK).json(deletedPlant);
  }
}
