import { CommentDto } from '../../common/dto/comment.dto';
import { PictureDataDto } from '../../common/dto/picture-data.dto';

export class ContainerSlotDTO {
  plant?: string;
  status?: string;
  plantedCount?: number;
  plantedDate?: string;
  transplantedDate?: string;
  comments?: CommentDto[];
  pictures?: PictureDataDto[];
}
