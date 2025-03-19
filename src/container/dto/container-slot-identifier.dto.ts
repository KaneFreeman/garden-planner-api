import { isNullish } from '../../util/null.util';

export interface ContainerSlotIdentifierDTO {
  readonly containerId: string;
  readonly slotId: number;
}

export function sanitizeContainerSlotIdentifierDto(
  raw: ContainerSlotIdentifierDTO | null | undefined
): ContainerSlotIdentifierDTO | undefined {
  if (isNullish(raw)) {
    return undefined;
  }

  return {
    containerId: `${raw.containerId}`,
    slotId: Number(raw.slotId)
  };
}
