import { Document } from 'mongoose';
import { Comment, PictureData } from '../../interface';

export interface Plant extends Document {
  readonly name: string;
  readonly type: string;
  readonly url: string;
  readonly daysToMaturity: [number, number];
  readonly pictures: PictureData[];
  readonly comments: Comment[];
}
