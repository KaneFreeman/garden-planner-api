import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { PictureDTO } from './dto/picture.dto';
import { Picture } from './interfaces/picture.interface';

@Injectable()
export class PictureService {
  constructor(
    @InjectModel('Picture') private readonly pictureModel: Model<Picture>,
  ) {}

  async addPicture(createPictureDTO: PictureDTO): Promise<Picture> {
    const newPicture = await this.pictureModel.create(createPictureDTO);
    return newPicture.save();
  }

  async getPicture(pictureId): Promise<Picture> {
    const picture = await this.pictureModel.findById(pictureId).exec();
    return picture;
  }

  async deletePicture(pictureId): Promise<Picture> {
    const deletedPicture = await this.pictureModel.findByIdAndRemove(pictureId);
    return deletedPicture;
  }
}
