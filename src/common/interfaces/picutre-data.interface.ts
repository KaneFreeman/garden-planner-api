import { Document } from 'mongoose';

export interface PictureDataDocument extends Document {
  readonly date: string;
  readonly id: number;
  readonly pictureId: string;
  readonly thumbnail: string;
  readonly deleted: boolean;
}
