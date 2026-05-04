import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { RealtimePublisher } from '../realtime/realtime.publisher';
import { PictureDTO } from './dto/picture.dto';
import { PictureDocument } from './interfaces/picture.document';
import { PictureProjection } from './interfaces/picture.projection';

@Injectable()
export class PictureService {
  constructor(
    @InjectModel('Picture') private readonly pictureModel: Model<PictureDocument>,
    private readonly realtimePublisher: RealtimePublisher
  ) {}

  async addPicture(createPictureDTO: PictureDTO, userId: string): Promise<PictureProjection> {
    const newPicture = await this.pictureModel.create({
      ...createPictureDTO,
      userId
    });
    const savedPicture = await newPicture.save();
    this.realtimePublisher.publishUserSync(userId, 'picture.added', { picture: savedPicture });
    return savedPicture;
  }

  async getPicture(pictureId: string, userId: string): Promise<PictureProjection | null> {
    return this.pictureModel.findOne({ _id: pictureId, userId }).exec();
  }

  async deletePicture(pictureId: string, userId: string): Promise<PictureProjection | null> {
    const deletedPicture = await this.pictureModel.findOneAndDelete({
      _id: pictureId,
      userId
    });

    if (deletedPicture) {
      this.realtimePublisher.publishUserSync(userId, 'picture.deleted', { deletedPictureId: pictureId });
    }

    return deletedPicture;
  }
}
