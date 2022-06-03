import { ContainerSlotIdentifier, HistoryStatus, TRANSPLANTED } from '../../interface';
import { PlantInstanceDocument } from '../interfaces/plant-instance.interface';

export function findHistoryByStatus(plantInstance: PlantInstanceDocument | undefined | null, status: HistoryStatus) {
  if (!plantInstance) {
    return undefined;
  }

  return plantInstance.history?.find((entry) => entry.status === status);
}

export function findHistoryFrom(
  plantInstance: PlantInstanceDocument | undefined | null,
  from: ContainerSlotIdentifier,
  status?: HistoryStatus
) {
  if (!plantInstance) {
    return undefined;
  }

  return plantInstance.history?.find((entry) => {
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

export function findHistoryTo(
  plantInstance: PlantInstanceDocument | undefined | null,
  to: ContainerSlotIdentifier,
  status?: HistoryStatus
) {
  if (!plantInstance) {
    return undefined;
  }

  return plantInstance.history?.find((entry) => {
    const toMatch =
      entry.to?.containerId === to.containerId && entry.to?.slotId === to.slotId && entry.to?.subSlot === to.subSlot;

    if (status) {
      return toMatch && entry.status === status;
    }

    return toMatch;
  });
}

export function getPlantedEvent(plantInstance: PlantInstanceDocument | undefined | null) {
  return plantInstance?.history?.[0];
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
