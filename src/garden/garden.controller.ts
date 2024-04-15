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
import { GardenDTO } from './dto/garden.dto';
import { GardenService } from './garden.service';
import { RequestWithUser } from '../auth/dto/requestWithUser';

@Controller('/api/garden')
export class GardenController {
  constructor(private gardenService: GardenService) {}

  // Submit a garden
  @UseGuards(AuthGuard)
  @Post('')
  async addGarden(@Req() req: RequestWithUser, @Res() res: Response, @Body() createGardenDTO: GardenDTO) {
    const newGarden = await this.gardenService.addGarden(createGardenDTO, req.user.userId);
    return res.status(HttpStatus.OK).json(newGarden);
  }

  // Fetch a particular garden using ID
  @UseGuards(AuthGuard)
  @Get('/:gardenId')
  async getGarden(
    @Req() req: RequestWithUser,
    @Res() res: Response,
    @Param('gardenId', new ValidateObjectId()) gardenId: string
  ) {
    const garden = await this.gardenService.getGarden(gardenId, req.user.userId);
    if (!garden) {
      throw new NotFoundException('Garden does not exist!');
    }
    return res.status(HttpStatus.OK).json(garden);
  }

  // Fetch all gardens
  @UseGuards(AuthGuard)
  @Get('')
  async getGardens(@Req() req: RequestWithUser, @Res() res: Response) {
    const gardens = await this.gardenService.getGardens(req.user.userId);
    return res.status(HttpStatus.OK).json(gardens);
  }

  // Edit a particular garden using ID
  @UseGuards(AuthGuard)
  @Put('/:gardenId')
  async editGarden(
    @Req() req: RequestWithUser,
    @Res() res: Response,
    @Param('gardenId', new ValidateObjectId()) gardenId: string,
    @Body() createGardenDTO: GardenDTO
  ) {
    const editedGarden = await this.gardenService.editGarden(gardenId, req.user.userId, createGardenDTO);
    if (!editedGarden) {
      throw new NotFoundException('Garden does not exist!');
    }
    return res.status(HttpStatus.OK).json(editedGarden);
  }

  // Delete a garden using ID
  @UseGuards(AuthGuard)
  @Delete('/:gardenId')
  async deleteGarden(
    @Req() req: RequestWithUser,
    @Res() res: Response,
    @Param('gardenId', new ValidateObjectId()) gardenId: string
  ) {
    const deletedGarden = await this.gardenService.deleteGarden(gardenId, req.user.userId);
    if (!deletedGarden) {
      throw new NotFoundException('Garden does not exist!');
    }
    return res.status(HttpStatus.OK).json(deletedGarden);
  }
}
