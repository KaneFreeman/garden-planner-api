import { CommentDto } from '../../common/dto/comment.dto';
import { PictureDataDto } from '../../common/dto/picture-data.dto';
import { ContainerSlotIdentifierDTO } from '../../container/dto/container-slot-identifier.dto';
import { PlantInstanceHistoryDto } from './plant-instance-history.dto';

export interface PlantInstanceDTO extends ContainerSlotIdentifierDTO {
  readonly plant?: string | null;
  readonly created?: string;
  readonly comments?: CommentDto[];
  readonly pictures?: PictureDataDto[];
  readonly history?: PlantInstanceHistoryDto[];
  readonly closed?: boolean;
}
