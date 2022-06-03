import { ContainerType, StartedFromType, toContainerType, toStartedFromType } from '../../interface';
import { isNotNullish, isNullish } from '../../util/null.util';
import mapRecord from '../../util/record.util';
import { ContainerSlotDTO, sanitizeContainerSlotDTO } from './container-slot.dto';

export interface ContainerDTO {
  readonly name: string;
  readonly type: ContainerType;
  readonly rows: number;
  readonly columns: number;
  readonly slots?: Record<string, ContainerSlotDTO>;
  readonly startedFrom?: StartedFromType;
  readonly archived?: boolean;
}

export function sanitizeContainerDTO(raw: ContainerDTO[] | null | undefined): ContainerDTO[] | undefined;
export function sanitizeContainerDTO(raw: ContainerDTO | null | undefined): ContainerDTO | undefined;
export function sanitizeContainerDTO(
  raw: ContainerDTO | ContainerDTO[] | null | undefined
): ContainerDTO | ContainerDTO[] | undefined {
  if (isNullish(raw)) {
    return undefined;
  }

  if (!Array.isArray(raw)) {
    return sanitizeContainerDTO([raw])?.[0];
  }

  return raw.map((dto) => ({
    name: `${dto.name}`,
    type: toContainerType(dto.type),
    rows: Number(dto.rows),
    columns: Number(dto.columns),
    slots: mapRecord(dto.slots, (slot) => sanitizeContainerSlotDTO(slot)),
    startedFrom: isNotNullish(dto.startedFrom) ? toStartedFromType(dto.startedFrom) : undefined,
    archived: Boolean(dto.archived)
  }));
}
