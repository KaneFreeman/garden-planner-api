import { Document } from 'mongoose';
import { CommentDocument } from '../../common/interfaces/comment.interface';
import { PictureDataDocument } from '../../common/interfaces/picutre-data.interface';
import { PlantType } from '../../interface';

export interface PlantDocument extends Document {
  readonly name: string;
  readonly type?: PlantType | null;
  readonly url?: string;
  readonly daysToGerminate?: [number | undefined, number | undefined];
  readonly daysToMaturity?: [number | undefined, number | undefined];
  readonly maturityFrom?: string;
  readonly pictures?: PictureDataDocument[];
  readonly comments?: CommentDocument[];
  readonly retired?: boolean;
}
