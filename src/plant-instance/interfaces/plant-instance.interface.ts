import { CommentDocument } from '../../common/interfaces/comment.interface';
import { PictureDataDocument } from '../../common/interfaces/picutre-data.interface';
import { ContainerSlotIdentifierDocument } from '../../container/interfaces/container-slot-identifier.interface';
import { StartedFromType } from '../../interface';
import { PlantInstanceHistoryDocument } from './plant-instance-history.interface';

export interface PlantInstanceDocument extends ContainerSlotIdentifierDocument {
  readonly plant?: string | null;
  readonly created: Date;
  readonly comments?: CommentDocument[];
  readonly pictures?: PictureDataDocument[];
  readonly history?: PlantInstanceHistoryDocument[];
  readonly closed?: boolean;
  readonly startedFrom: StartedFromType;
  readonly plantedCount: number;
}
