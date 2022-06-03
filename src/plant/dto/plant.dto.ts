import { CommentDto, sanitizeCommentDto } from '../../common/dto/comment.dto';
import { PictureDataDto, sanitizePictureDataDto } from '../../common/dto/picture-data.dto';
import { toPlantType } from '../../interface';
import { isNotNullish, isNullish } from '../../util/null.util';

export interface PlantDTO {
  readonly name: string;
  readonly type?: string | null;
  readonly url?: string;
  readonly daysToMaturity?: [number | undefined, number | undefined];
  readonly pictures?: PictureDataDto[];
  readonly comments?: CommentDto[];
}

export function sanitizePlantDTO(raw: PlantDTO[] | null | undefined): PlantDTO[] | undefined;
export function sanitizePlantDTO(raw: PlantDTO | null | undefined): PlantDTO | undefined;
export function sanitizePlantDTO(raw: PlantDTO | PlantDTO[] | null | undefined): PlantDTO | PlantDTO[] | undefined {
  if (isNullish(raw)) {
    return undefined;
  }

  if (!Array.isArray(raw)) {
    return sanitizePlantDTO([raw])?.[0];
  }

  return raw.map((dto) => ({
    name: `${dto.name}`,
    type: toPlantType(dto.type),
    url: isNotNullish(dto.url) ? `${dto.url}` : undefined,
    daysToMaturity:
      isNotNullish(dto.daysToMaturity) && Array.isArray(dto.daysToMaturity)
        ? [
            isNotNullish(dto.daysToMaturity[0]) ? Number(dto.daysToMaturity[0]) : undefined,
            isNotNullish(dto.daysToMaturity[1]) ? Number(dto.daysToMaturity[1]) : undefined
          ]
        : undefined,
    pictures: sanitizePictureDataDto(dto.pictures),
    comments: sanitizeCommentDto(dto.comments)
  }));
}
