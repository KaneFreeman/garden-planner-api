export interface ContainerSlotIdentifierDocument {
  readonly _id: string;
  readonly containerId: string;
  readonly slotId: number;
  readonly subSlot?: boolean;
}
