import { CommentProjection } from '../../common/interfaces/comment.projection';
import { PictureDataProjection } from '../../common/interfaces/picutre-data.projection';
import { ContainerSlotIdentifier } from '../../container/interfaces/container-slot-identifier.interface';
import { Season, StartedFromType } from '../../interface';
import { PlantInstanceHistoryDocument } from './plant-instance-history.document';

export interface PlantInstanceProjection extends ContainerSlotIdentifier {
  readonly plant: string | null;
  readonly created: Date;
  readonly comments?: CommentProjection[];
  readonly pictures?: PictureDataProjection[];
  readonly history?: PlantInstanceHistoryDocument[];
  readonly closed?: boolean;
  readonly startedFrom: StartedFromType;
  readonly season: Season;
}
