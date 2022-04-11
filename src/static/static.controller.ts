import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { Response } from 'express';
import mapRecord from '../util/record.util';
import { PlantDataDTO } from './dto/PlantDataDTO';
import { StaticService } from './static.service';

@Controller('api/static')
export class StaticController {
  constructor(private staticService: StaticService) {}

  // Fetch plant data
  @Get('/plantData')
  async getPlantDatas(@Res() res: Response) {
    const plantData = await this.staticService.getPlantData();
    return res
      .status(HttpStatus.OK)
      .json(mapRecord(plantData, PlantDataDTO.toDTO));
  }
}
