import { Document } from 'mongoose';

export interface ContainerSlotIdentifierDocument extends Document<string> {
  readonly containerId: string;
  readonly slotId: number;
  readonly subSlot?: boolean;
}
