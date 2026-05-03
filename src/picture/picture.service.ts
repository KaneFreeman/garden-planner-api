import { Injectable } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { PictureDTO } from './dto/picture.dto';
import { PictureDocument } from './interfaces/picture.document';
import { PictureProjection } from './interfaces/picture.projection';

@Injectable()
export class PictureService {
  constructor(@InjectModel('Picture') private readonly pictureModel: Model<PictureDocument>) {}

  async addPicture(createPictureDTO: PictureDTO, userId: string): Promise<PictureProjection> {
    const newPicture = await this.pictureModel.create({
      ...createPictureDTO,
      userId: new Types.ObjectId(userId)
    });
    return newPicture.save();
  }

  async getPicture(pictureId: string, userId: string): Promise<PictureProjection | null> {
    return this.pictureModel.findOne({ _id: pictureId, userId: new Types.ObjectId(userId) }).exec();
  }

  async deletePicture(pictureId: string, userId: string): Promise<PictureProjection | null> {
    return this.pictureModel.findOneAndDelete({ _id: pictureId, userId: new Types.ObjectId(userId) });
  }
}
