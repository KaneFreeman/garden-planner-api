import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Res,
  UseGuards
} from '@nestjs/common';
import { Response } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { ValidateObjectId } from '../shared/pipes/validate-object-id.pipes';
import { PictureDTO } from './dto/picture.dto';
import { PictureService } from './picture.service';

@Controller('api/picture')
export class PictureController {
  constructor(private pictureService: PictureService) {}

  // Submit a picture
  @UseGuards(AuthGuard)
  @Post('')
  async addPicture(@Res() res: Response, @Body() createPictureDTO: PictureDTO) {
    const newPicture = await this.pictureService.addPicture(createPictureDTO);
    return res.status(HttpStatus.OK).json(newPicture);
  }

  // Fetch a particular picture using ID
  @UseGuards(AuthGuard)
  @Get('/:pictureId')
  async getPicture(@Res() res: Response, @Param('pictureId', new ValidateObjectId()) pictureId: string) {
    const picture = await this.pictureService.getPicture(pictureId);
    if (!picture) {
      throw new NotFoundException('Picture does not exist!');
    }
    return res.status(HttpStatus.OK).json(picture);
  }

  // Delete a picture using ID
  @UseGuards(AuthGuard)
  @Delete('/:pictureId')
  async deletePicture(@Res() res: Response, @Param('pictureId', new ValidateObjectId()) pictureId: string) {
    const deletedPicture = await this.pictureService.deletePicture(pictureId);
    if (!deletedPicture) {
      throw new NotFoundException('Picture does not exist!');
    }
    return res.status(HttpStatus.OK).json(deletedPicture);
  }
}
