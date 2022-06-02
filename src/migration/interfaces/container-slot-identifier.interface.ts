import { Document } from 'mongoose';

export interface ContainerSlotIdentifier extends Document {
  readonly containerId: string;
  readonly slotId: number;
  readonly subSlot?: boolean;
}
