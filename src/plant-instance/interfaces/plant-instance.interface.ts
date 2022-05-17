import { CommentDocument } from '../../common/interfaces/comment.interface';
import { PictureDataDocument } from '../../common/interfaces/picutre-data.interface';
import { ContainerSlotIdentifierDocument } from '../../container/interfaces/container-slot-identifier.interface';
import { PlantInstanceHistoryDocument } from './plant-instance-history.interface';

export interface PlantInstanceDocument extends ContainerSlotIdentifierDocument {
  readonly plant?: string | null;
  readonly comments?: CommentDocument[];
  readonly pictures?: PictureDataDocument[];
  readonly history?: PlantInstanceHistoryDocument[];
  readonly closed?: boolean;
}
