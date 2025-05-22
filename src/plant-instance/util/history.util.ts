import { ContainerSlotIdentifier, HistoryStatus, PLANTED, TRANSPLANTED } from '../../interface';
import { PlantInstanceHistoryDocument } from '../interfaces/plant-instance-history.document';
import { PlantInstanceProjection } from '../interfaces/plant-instance.projection';

export function findHistoryByStatus(plantInstance: PlantInstanceProjection | undefined | null, status: HistoryStatus) {
  if (!plantInstance) {
    return undefined;
  }

  return plantInstance.history?.find((entry) => entry.status === status);
}

export function findHistoryFromIndex(
  plantInstance: PlantInstanceProjection | undefined | null,
  from: ContainerSlotIdentifier | undefined | null,
  status?: HistoryStatus
): number | undefined {
  if (!plantInstance || !from) {
    return undefined;
  }

  return plantInstance.history?.findIndex((entry) => {
    const fromMatch = entry.from?.containerId === from.containerId && entry.from?.slotId === from.slotId;

    if (status) {
      return fromMatch && entry.status === status;
    }

    return fromMatch;
  });
}

export function findHistoryFrom(
  plantInstance: PlantInstanceProjection | undefined | null,
  from: ContainerSlotIdentifier | undefined | null,
  status?: HistoryStatus
): PlantInstanceHistoryDocument | undefined {
  const index = findHistoryFromIndex(plantInstance, from, status);
  return index !== undefined ? plantInstance?.history?.[index] : undefined;
}

export function findHistoryToIndex(
  plantInstance: PlantInstanceProjection | undefined | null,
  to: ContainerSlotIdentifier | undefined | null,
  status?: HistoryStatus
): number | undefined {
  if (!plantInstance || !to) {
    return undefined;
  }

  return plantInstance.history?.findIndex((entry) => {
    const toMatch = entry.to?.containerId.toString() === to.containerId.toString() && entry.to?.slotId === to.slotId;

    if (status) {
      return toMatch && entry.status === status;
    }

    return toMatch;
  });
}

export function findHistoryTo(
  plantInstance: PlantInstanceProjection | undefined | null,
  to: ContainerSlotIdentifier | undefined | null,
  status?: HistoryStatus
): PlantInstanceHistoryDocument | undefined {
  const index = findHistoryToIndex(plantInstance, to, status);
  return index !== undefined ? plantInstance?.history?.[index] : undefined;
}

export function getPlantedEvent(
  plantInstance: PlantInstanceProjection | undefined | null
): PlantInstanceHistoryDocument | undefined {
  return plantInstance?.history?.find((entry) => entry.status === PLANTED);
}

export function getPlantedDate(plantInstance: PlantInstanceProjection | undefined | null) {
  return getPlantedEvent(plantInstance)?.date ?? null;
}

export function getTransplantedDate(
  plantInstance: PlantInstanceProjection | undefined | null,
  to: ContainerSlotIdentifier
) {
  return findHistoryTo(plantInstance, to, TRANSPLANTED)?.date ?? null;
}
