import { CommentDto } from '../../common/dto/comment.dto';
import { PictureDataDto } from '../../common/dto/picture-data.dto';
import { ContainerSlotIdentifier } from '../../interface';

export class ContainerSlotDTO {
  plant?: string;
  status?: string;
  plantedCount?: number;
  plantedDate?: string;
  transplantedDate?: string;
  transplantedTo?: ContainerSlotIdentifier;
  transplantedFrom?: ContainerSlotIdentifier;
  comments?: CommentDto[];
  pictures?: PictureDataDto[];
}
