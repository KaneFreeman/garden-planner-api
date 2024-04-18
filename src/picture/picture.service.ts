import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { PictureDTO } from './dto/picture.dto';
import { PictureDocument } from './interfaces/picture.document';
import { PictureProjection } from './interfaces/picture.projection';

@Injectable()
export class PictureService {
  constructor(@InjectModel('Picture') private readonly pictureModel: Model<PictureDocument>) {}

  async addPicture(createPictureDTO: PictureDTO): Promise<PictureProjection> {
    const newPicture = await this.pictureModel.create(createPictureDTO);
    return newPicture.save();
  }

  async getPicture(pictureId: string): Promise<PictureProjection | null> {
    return this.pictureModel.findById(pictureId).exec();
  }

  async deletePicture(pictureId: string): Promise<PictureProjection | null> {
    return this.pictureModel.findByIdAndDelete(pictureId);
  }
}
