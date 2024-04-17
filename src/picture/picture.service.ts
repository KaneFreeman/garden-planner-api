import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { PictureDTO } from './dto/picture.dto';
import { Picture } from './interfaces/picture.interface';

@Injectable()
export class PictureService {
  constructor(@InjectModel('Picture') private readonly pictureModel: Model<Picture>) {}

  async addPicture(createPictureDTO: PictureDTO): Promise<Picture> {
    const newPicture = await this.pictureModel.create(createPictureDTO);
    return newPicture.save();
  }

  async getPicture(pictureId: string): Promise<Picture | null> {
    return this.pictureModel.findById(pictureId).exec();
  }

  async deletePicture(pictureId: string): Promise<Picture | null> {
    return this.pictureModel.findByIdAndDelete(pictureId);
  }
}
