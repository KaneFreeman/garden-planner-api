import { Document } from 'mongoose';
import { CommentDocument } from '../../common/interfaces/comment.interface';
import { PictureDataDocument } from '../../common/interfaces/picutre-data.interface';

export interface PlantDocument extends Document {
  readonly name: string;
  readonly type: string;
  readonly url: string;
  readonly daysToMaturity: [number | undefined, number | undefined];
  readonly pictures?: PictureDataDocument[];
  readonly comments?: CommentDocument[];
}
