import { CommentDto, sanitizeCommentDto } from '../../common/dto/comment.dto';
import { PictureDataDto, sanitizePictureDataDto } from '../../common/dto/picture-data.dto';
import { ContainerSlotIdentifierDTO } from '../../container/dto/container-slot-identifier.dto';
import { toSeason, toStartedFromType } from '../../interface';
import { isNotNullish, isNullish } from '../../util/null.util';
import { PlantInstanceHistoryDto, sanitizePlantInstanceHistoryDto } from './plant-instance-history.dto';

export interface PlantInstanceDTO extends ContainerSlotIdentifierDTO {
  readonly plant: string | null;
  readonly created: string;
  readonly comments?: CommentDto[];
  readonly pictures?: PictureDataDto[];
  readonly history?: PlantInstanceHistoryDto[];
  readonly closed?: boolean;
  readonly startedFrom: string;
  readonly season: string;
}

export function sanitizePlantInstanceDTO(raw: PlantInstanceDTO): PlantInstanceDTO;
export function sanitizePlantInstanceDTO(raw: PlantInstanceDTO | null | undefined): PlantInstanceDTO | undefined;
export function sanitizePlantInstanceDTO(raw: PlantInstanceDTO[]): PlantInstanceDTO[];
export function sanitizePlantInstanceDTO(raw: PlantInstanceDTO[] | null | undefined): PlantInstanceDTO[] | undefined;
export function sanitizePlantInstanceDTO(
  raw: PlantInstanceDTO | PlantInstanceDTO[] | null | undefined
): PlantInstanceDTO | PlantInstanceDTO[] | undefined {
  if (isNullish(raw)) {
    return undefined;
  }

  if (!Array.isArray(raw)) {
    return sanitizePlantInstanceDTO([raw])?.[0];
  }

  return raw.map((dto) => ({
    plant: isNotNullish(dto.plant) ? `${dto.plant}` : null,
    created: `${dto.created}`,
    comments: sanitizeCommentDto(dto.comments),
    pictures: sanitizePictureDataDto(dto.pictures),
    history: sanitizePlantInstanceHistoryDto(dto.history),
    closed: Boolean(dto.closed),
    startedFrom: toStartedFromType(dto.startedFrom),
    season: toSeason(dto.season),
    containerId: `${dto.containerId}`,
    slotId: Number(dto.slotId)
  }));
}
