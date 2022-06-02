export interface BaseContainerSlotDTO {
  readonly plantInstanceId?: string;
}

export interface ContainerSlotDTO extends BaseContainerSlotDTO {
  readonly subSlot?: BaseContainerSlotDTO;
}
