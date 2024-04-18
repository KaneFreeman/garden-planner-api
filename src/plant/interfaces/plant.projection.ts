import { CommentProjection } from '../../common/interfaces/comment.projection';
import { PictureDataProjection } from '../../common/interfaces/picutre-data.projection';
import { PlantType } from '../../interface';

export interface PlantProjection {
  readonly _id: string;
  readonly name: string;
  readonly type?: PlantType | null;
  readonly url?: string;
  readonly daysToGerminate?: [number | undefined, number | undefined];
  readonly daysToMaturity?: [number | undefined, number | undefined];
  readonly maturityFrom?: string;
  readonly pictures?: PictureDataProjection[];
  readonly comments?: CommentProjection[];
  readonly userId?: string;
  readonly retired?: boolean;
}
