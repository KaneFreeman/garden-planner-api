import { isNotNullish, isNullish } from '../../util/null.util';

export interface BaseContainerSlotDTO {
  readonly plant?: string | null;
  readonly plantInstanceId?: string | null;
  readonly plantInstanceHistory?: string[];
}

export interface ContainerSlotDTO extends BaseContainerSlotDTO {
  readonly subSlot?: BaseContainerSlotDTO;
}

function isContainerSlotDTO(dto: ContainerSlotDTO | BaseContainerSlotDTO): dto is ContainerSlotDTO {
  return 'subSlot' in dto;
}

export function sanitizeContainerSlotDTO(raw: ContainerSlotDTO[] | null | undefined): ContainerSlotDTO[];
export function sanitizeContainerSlotDTO(raw: ContainerSlotDTO | null | undefined): ContainerSlotDTO;
export function sanitizeContainerSlotDTO(
  raw: BaseContainerSlotDTO[] | null | undefined
): BaseContainerSlotDTO[] | undefined;
export function sanitizeContainerSlotDTO(
  raw: BaseContainerSlotDTO | null | undefined
): BaseContainerSlotDTO | undefined;
export function sanitizeContainerSlotDTO(
  raw: ContainerSlotDTO | ContainerSlotDTO[] | BaseContainerSlotDTO | BaseContainerSlotDTO[] | null | undefined
): ContainerSlotDTO | ContainerSlotDTO[] | BaseContainerSlotDTO | BaseContainerSlotDTO[] | undefined {
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

    if (isContainerSlotDTO(dto)) {
      return {
        plant,
        plantInstanceId,
        plantInstanceHistory,
        subSlot: isNotNullish(dto.subSlot) ? sanitizeContainerSlotDTO(dto.subSlot) : undefined
      };
    }

    return {
      plant,
      plantInstanceId,
      plantInstanceHistory
    };
  });
}
