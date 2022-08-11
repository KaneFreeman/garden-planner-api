import { CommentDto, sanitizeCommentDto } from '../../common/dto/comment.dto';
import { PictureDataDto, sanitizePictureDataDto } from '../../common/dto/picture-data.dto';
import { toPlantType } from '../../interface';
import { isNotNullish, isNullish } from '../../util/null.util';

export interface PlantDTO {
  readonly name: string;
  readonly type?: string | null;
  readonly url?: string;
  readonly daysToGerminate?: [number | undefined, number | undefined];
  readonly daysToMaturity?: [number | undefined, number | undefined];
  readonly pictures?: PictureDataDto[];
  readonly comments?: CommentDto[];
  readonly retired?: boolean;
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
    daysToGerminate:
      isNotNullish(dto.daysToGerminate) && Array.isArray(dto.daysToGerminate)
        ? [
            isNotNullish(dto.daysToGerminate[0]) ? Number(dto.daysToGerminate[0]) : undefined,
            isNotNullish(dto.daysToGerminate[1]) ? Number(dto.daysToGerminate[1]) : undefined
          ]
        : undefined,
    daysToMaturity:
      isNotNullish(dto.daysToMaturity) && Array.isArray(dto.daysToMaturity)
        ? [
            isNotNullish(dto.daysToMaturity[0]) ? Number(dto.daysToMaturity[0]) : undefined,
            isNotNullish(dto.daysToMaturity[1]) ? Number(dto.daysToMaturity[1]) : undefined
          ]
        : undefined,
    pictures: sanitizePictureDataDto(dto.pictures),
    comments: sanitizeCommentDto(dto.comments),
    retired: isNotNullish(dto.retired) ? Boolean(dto.retired) : false
  }));
}
