import { Controller, Get, HttpStatus, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import mapRecord from '../util/record.util';
import { PlantDataDTO } from './dto/PlantDataDTO';
import { StaticService } from './static.service';

@Controller('api/static')
export class StaticController {
  constructor(private staticService: StaticService) {}

  // Fetch plant data
  @UseGuards(AuthGuard)
  @Get('/plantData')
  async getPlantDatas(@Res() res: Response) {
    const plantData = await this.staticService.getPlantData();
    return res.status(HttpStatus.OK).json(mapRecord(plantData, PlantDataDTO.toDTO));
  }
}
