import { ContainerSlotIdentifier, Status, TRANSPLANTED } from '../../interface';
import { PlantInstanceDocument } from '../interfaces/plant-instance.interface';

export function findHistoryFrom(
  plantInstance: PlantInstanceDocument | undefined | null,
  from: ContainerSlotIdentifier,
  status?: Status
) {
  if (!plantInstance) {
    return undefined;
  }

  return plantInstance.history?.find((entry) => {
    const fromMatch =
      entry.from.containerId === from.containerId &&
      entry.from.slotId === from.slotId &&
      entry.from.subSlot === from.subSlot;

    if (status) {
      return fromMatch && entry.status === status;
    }

    return fromMatch;
  });
}

export function findHistoryTo(
  plantInstance: PlantInstanceDocument | undefined | null,
  from: ContainerSlotIdentifier,
  status?: Status
) {
  if (!plantInstance) {
    return undefined;
  }

  return plantInstance.history?.find((entry) => {
    const fromMatch =
      entry.from.containerId === from.containerId &&
      entry.from.slotId === from.slotId &&
      entry.from.subSlot === from.subSlot;

    if (status) {
      return fromMatch && entry.status === status;
    }

    return fromMatch;
  });
}

export function getPlantedDate(plantInstance: PlantInstanceDocument | undefined | null) {
  return plantInstance?.history?.[0]?.date ?? null;
}

export function getTransplantedDate(
  plantInstance: PlantInstanceDocument | undefined | null,
  from: ContainerSlotIdentifier
) {
  return findHistoryTo(plantInstance, from, TRANSPLANTED)?.date ?? null;
}
