import { CommentDto } from '../../common/dto/comment.dto';
import { PictureDataDto } from '../../common/dto/picture-data.dto';

export class PlantDTO {
  readonly name: string;
  readonly type?: string;
  readonly url?: string;
  readonly daysToMaturity?: [number, number];
  readonly pictures?: PictureDataDto[];
  readonly comments?: CommentDto[];
}
