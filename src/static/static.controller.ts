import { Controller, Get, HttpStatus, Req, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { RequestWithUser } from '../auth/dto/requestWithUser';
import { StaticService } from './static.service';

@Controller('api/static')
export class StaticController {
  constructor(private staticService: StaticService) {}

  // Fetch plant data
  @UseGuards(AuthGuard)
  @Get('/plantData')
  async getPlantDatas(@Req() req: RequestWithUser, @Res() res: Response) {
    const plantData = await this.staticService.getPlantData(req.user.userId);
    return res.status(HttpStatus.OK).json(plantData);
  }
}
