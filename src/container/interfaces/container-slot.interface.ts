import { Document } from 'mongoose';

export interface BaseSlotDocument extends Document {
  readonly plantInstanceId?: string;
  readonly plannedPlantId: string | null;
}

export interface SlotDocument extends BaseSlotDocument {
  readonly subSlot?: BaseSlotDocument;
}
