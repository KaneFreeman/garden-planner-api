import {
  Controller,
  Get,
  Res,
  HttpStatus,
  Param,
  NotFoundException,
  Post,
  Body,
  Delete,
} from '@nestjs/common';
import { PictureService } from './picture.service';
import { PictureDTO } from './dto/picture.dto';
import { ValidateObjectId } from '../shared/pipes/validate-object-id.pipes';

@Controller('api/picture')
export class PictureController {
  constructor(private pictureService: PictureService) {}

  // Submit a picture
  @Post('')
  async addPicture(@Res() res, @Body() createPictureDTO: PictureDTO) {
    const newPicture = await this.pictureService.addPicture(createPictureDTO);
    return res.status(HttpStatus.OK).json(newPicture);
  }

  // Fetch a particular picture using ID
  @Get('/:pictureId')
  async getPicture(
    @Res() res,
    @Param('pictureId', new ValidateObjectId()) pictureId,
  ) {
    const picture = await this.pictureService.getPicture(pictureId);
    if (!picture) {
      throw new NotFoundException('Picture does not exist!');
    }
    return res.status(HttpStatus.OK).json(picture);
  }

  // Delete a picture using ID
  @Delete('/:pictureId')
  async deletePicture(
    @Res() res,
    @Param('pictureId', new ValidateObjectId()) pictureId,
  ) {
    const deletedPicture = await this.pictureService.deletePicture(pictureId);
    if (!deletedPicture) {
      throw new NotFoundException('Picture does not exist!');
    }
    return res.status(HttpStatus.OK).json(deletedPicture);
  }
}
