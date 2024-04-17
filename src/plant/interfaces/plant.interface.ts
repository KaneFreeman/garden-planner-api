import { CommentDocument } from '../../common/interfaces/comment.interface';
import { PictureDataDocument } from '../../common/interfaces/picutre-data.interface';
import { PlantType } from '../../interface';

export interface PlantDocument {
  readonly _id: string;
  readonly name: string;
  readonly type?: PlantType | null;
  readonly url?: string;
  readonly daysToGerminate?: [number | undefined, number | undefined];
  readonly daysToMaturity?: [number | undefined, number | undefined];
  readonly maturityFrom?: string;
  readonly pictures?: PictureDataDocument[];
  readonly comments?: CommentDocument[];
  readonly userId?: string;
  readonly retired?: boolean;
}
