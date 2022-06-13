import { isNotNullish, isNullish } from '../../util/null.util';

export interface BaseContainerSlotDTO {
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
    if (isContainerSlotDTO(dto)) {
      return {
        plantInstanceId: `${dto.plantInstanceId}`,
        plantInstanceHistory: dto.plantInstanceHistory?.map((id) => `${id}`),
        subSlot: isNotNullish(dto.subSlot) ? sanitizeContainerSlotDTO(dto.subSlot) : undefined
      };
    }

    return {
      plantInstanceId: isNotNullish(dto.plantInstanceId) ? `${dto.plantInstanceId}` : null,
      plantInstanceHistory: dto.plantInstanceHistory?.map((id) => `${id}`)
    };
  });
}
