import { Document } from 'mongoose';
import { CommentDocument } from '../../common/interfaces/comment.document';
import { PictureDataDocument } from '../../common/interfaces/picutre-data.document';
import { PlantInstanceHistoryDocument } from './plant-instance-history.document';
import { PlantInstanceProjection } from './plant-instance.projection';

type CommonPlantInstanceDocument = Omit<PlantInstanceProjection, 'comments' | 'pictures' | 'history'> &
  Document<string>;

export interface PlantInstanceDocument extends CommonPlantInstanceDocument {
  readonly comments?: CommentDocument[];
  readonly pictures?: PictureDataDocument[];
  readonly history?: PlantInstanceHistoryDocument[];
}
