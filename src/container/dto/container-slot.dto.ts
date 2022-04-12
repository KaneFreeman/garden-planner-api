import { CommentDto } from '../../common/dto/comment.dto';
import { PictureDataDto } from '../../common/dto/picture-data.dto';
import { ContainerSlotIdentifier } from '../../interface';

export class BaseContainerSlotDTO {
  readonly plant?: string;
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

export class ContainerSlotDTO extends BaseContainerSlotDTO {
  readonly subSlot?: BaseContainerSlotDTO;
}
