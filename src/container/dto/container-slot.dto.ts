import { isNotNullish, isNullish } from '../../util/null.util';

export interface ContainerSlotDTO {
  readonly plant?: string | null;
  readonly plantInstanceId?: string | null;
  readonly plantInstanceHistory?: string[];
}

export function sanitizeContainerSlotDTO(raw: ContainerSlotDTO[] | null | undefined): ContainerSlotDTO[];
export function sanitizeContainerSlotDTO(raw: ContainerSlotDTO | null | undefined): ContainerSlotDTO;
export function sanitizeContainerSlotDTO(
  raw: ContainerSlotDTO | ContainerSlotDTO[] | ContainerSlotDTO | ContainerSlotDTO[] | null | undefined
): ContainerSlotDTO | ContainerSlotDTO[] | ContainerSlotDTO | ContainerSlotDTO[] | undefined {
  if (isNullish(raw)) {
    return {};
  }

  if (!Array.isArray(raw)) {
    return sanitizeContainerSlotDTO([raw])?.[0];
  }

  return raw.map((dto) => {
    const plant = isNotNullish(dto.plant) ? `${dto.plant}` : null;
    const plantInstanceId = isNotNullish(dto.plantInstanceId) ? `${dto.plantInstanceId}` : null;
    const plantInstanceHistory = dto.plantInstanceHistory?.map((id) => `${id}`);

    return {
      plant,
      plantInstanceId,
      plantInstanceHistory
    };
  });
}
