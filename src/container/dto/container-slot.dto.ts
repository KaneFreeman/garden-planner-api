export interface BaseContainerSlotDTO {
  readonly plantInstanceId?: string;
  readonly plannedPlantId: string | null;
}

export interface ContainerSlotDTO extends BaseContainerSlotDTO {
  readonly subSlot?: BaseContainerSlotDTO;
}
