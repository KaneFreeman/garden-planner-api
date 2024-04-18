import { Document } from 'mongoose';
import { CommentDocument } from '../../common/interfaces/comment.document';
import { PictureDataDocument } from '../../common/interfaces/picutre-data.document';
import { PlantProjection } from './plant.projection';

type CommonPlantDocument = Omit<PlantProjection, 'pictures' | 'comments'> & Document<string>;

export interface PlantDocument extends CommonPlantDocument {
  readonly pictures?: PictureDataDocument[];
  readonly comments?: CommentDocument[];
}
