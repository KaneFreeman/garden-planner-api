import { Document } from 'mongoose';

export interface BaseSlotDocument extends Document {
  readonly plantInstanceId?: string;
  readonly plantInstanceHistory?: string[];
}

export interface SlotDocument extends BaseSlotDocument {
  readonly subSlot?: BaseSlotDocument;
}
