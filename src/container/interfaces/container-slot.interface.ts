export interface BaseSlotDocument {
  readonly _id: string;
  readonly plant?: string | null;
  readonly plantInstanceId?: string | null;
  readonly plantInstanceHistory?: string[];
}

export interface SlotDocument extends BaseSlotDocument {
  readonly subSlot?: BaseSlotDocument;
}
