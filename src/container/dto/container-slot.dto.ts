export interface BaseContainerSlotDTO {
  readonly plantInstanceId?: string;
  readonly plannedPlantId?: string;
}

export interface ContainerSlotDTO extends BaseContainerSlotDTO {
  readonly subSlot?: BaseContainerSlotDTO;
}
