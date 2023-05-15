import { ContainerSlotIdentifier, HistoryStatus, TRANSPLANTED, PLANTED } from '../../interface';
import { PlantInstanceDocument } from '../interfaces/plant-instance.interface';
import { PlantInstanceHistoryDocument } from '../interfaces/plant-instance-history.interface';

export function findHistoryByStatus(plantInstance: PlantInstanceDocument | undefined | null, status: HistoryStatus) {
  if (!plantInstance) {
    return undefined;
  }

  return plantInstance.history?.find((entry) => entry.status === status);
}

export function findHistoryFromIndex(
  plantInstance: PlantInstanceDocument | undefined | null,
  from: ContainerSlotIdentifier | undefined | null,
  status?: HistoryStatus
): number | undefined {
  if (!plantInstance || !from) {
    return undefined;
  }

  return plantInstance.history?.findIndex((entry) => {
    const fromMatch =
      entry.from?.containerId === from.containerId &&
      entry.from?.slotId === from.slotId &&
      entry.from?.subSlot === from.subSlot;

    if (status) {
      return fromMatch && entry.status === status;
    }

    return fromMatch;
  });
}

export function findHistoryFrom(
  plantInstance: PlantInstanceDocument | undefined | null,
  from: ContainerSlotIdentifier | undefined | null,
  status?: HistoryStatus
): PlantInstanceHistoryDocument | undefined {
  const index = findHistoryFromIndex(plantInstance, from, status);
  return index !== undefined ? plantInstance?.history?.[index] : undefined;
}

export function findHistoryToIndex(
  plantInstance: PlantInstanceDocument | undefined | null,
  to: ContainerSlotIdentifier | undefined | null,
  status?: HistoryStatus
): number | undefined {
  if (!plantInstance || !to) {
    return undefined;
  }

  return plantInstance.history?.findIndex((entry) => {
    const fromMatch =
      entry.from?.containerId === to.containerId &&
      entry.from?.slotId === to.slotId &&
      entry.from?.subSlot === to.subSlot;

    if (status) {
      return fromMatch && entry.status === status;
    }

    return fromMatch;
  });
}

export function findHistoryTo(
  plantInstance: PlantInstanceDocument | undefined | null,
  to: ContainerSlotIdentifier | undefined | null,
  status?: HistoryStatus
): PlantInstanceHistoryDocument | undefined {
  const index = findHistoryToIndex(plantInstance, to, status);
  return index !== undefined ? plantInstance?.history?.[index] : undefined;
}

export function getPlantedEvent(
  plantInstance: PlantInstanceDocument | undefined | null
): PlantInstanceHistoryDocument | undefined {
  return plantInstance?.history?.find((entry) => entry.status === PLANTED);
}

export function getPlantedDate(plantInstance: PlantInstanceDocument | undefined | null) {
  return getPlantedEvent(plantInstance)?.date ?? null;
}

export function getTransplantedDate(
  plantInstance: PlantInstanceDocument | undefined | null,
  from: ContainerSlotIdentifier
) {
  return findHistoryTo(plantInstance, from, TRANSPLANTED)?.date ?? null;
}
