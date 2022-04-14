import { CommentDto } from '../../common/dto/comment.dto';
import { PictureDataDto } from '../../common/dto/picture-data.dto';
import { ContainerSlotIdentifierDTO } from './container-slot-identifier.dto';

export interface BaseContainerSlotDTO {
  readonly plant?: string | null;
  readonly status?: string;
  readonly plantedCount?: number;
  readonly plantedDate?: string;
  readonly transplantedDate?: string;
  readonly transplantedTo: ContainerSlotIdentifierDTO | null;
  readonly transplantedFrom: ContainerSlotIdentifierDTO | null;
  readonly firstHarvestDate?: string;
  readonly comments?: CommentDto[];
  readonly pictures?: PictureDataDto[];
}

export interface ContainerSlotDTO extends BaseContainerSlotDTO {
  readonly subSlot?: BaseContainerSlotDTO;
}
