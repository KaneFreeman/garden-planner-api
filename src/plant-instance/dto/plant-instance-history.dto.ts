import {
  ContainerSlotIdentifierDTO,
  sanitizeContainerSlotIdentifierDto
} from '../../container/dto/container-slot-identifier.dto';
import { HistoryStatus, toHistoryStatus } from '../../interface';
import { isNullish } from '../../util/null.util';

export interface PlantInstanceHistoryDto {
  readonly from?: ContainerSlotIdentifierDTO;
  readonly to?: ContainerSlotIdentifierDTO;
  readonly status: HistoryStatus;
  readonly date: string;
}

export function sanitizePlantInstanceHistoryDto(
  raw: PlantInstanceHistoryDto[] | null | undefined
): PlantInstanceHistoryDto[] | undefined;
export function sanitizePlantInstanceHistoryDto(
  raw: PlantInstanceHistoryDto | null | undefined
): PlantInstanceHistoryDto | undefined;
export function sanitizePlantInstanceHistoryDto(
  raw: PlantInstanceHistoryDto | PlantInstanceHistoryDto[] | null | undefined
): PlantInstanceHistoryDto | PlantInstanceHistoryDto[] | undefined {
  if (isNullish(raw)) {
    return undefined;
  }

  if (!Array.isArray(raw)) {
    return sanitizePlantInstanceHistoryDto([raw])?.[0];
  }

  return raw.map((dto) => ({
    from: sanitizeContainerSlotIdentifierDto(dto.from),
    to: sanitizeContainerSlotIdentifierDto(dto.to),
    status: toHistoryStatus(dto.status),
    date: `${dto.date}`
  }));
}
