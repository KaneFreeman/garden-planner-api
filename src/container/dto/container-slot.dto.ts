import { CommentDto } from '../../common/dto/comment.dto';
import { PictureDataDto } from '../../common/dto/picture-data.dto';
import { ContainerSlotIdentifier } from '../../interface';

export interface BaseContainerSlotDTO {
  readonly plant?: string | null;
  readonly status?: string;
  readonly plantedCount?: number;
  readonly plantedDate?: string;
  readonly transplantedDate?: string;
  readonly transplantedTo: ContainerSlotIdentifier | null;
  readonly transplantedFrom: ContainerSlotIdentifier | null;
  readonly firstHarvestDate?: string;
  readonly comments?: CommentDto[];
  readonly pictures?: PictureDataDto[];
}

export interface ContainerSlotDTO extends BaseContainerSlotDTO {
  readonly subSlot?: BaseContainerSlotDTO;
}
