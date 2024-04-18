export interface BaseSlot {
  readonly _id: string;
  readonly plant?: string | null;
  readonly plantInstanceId?: string | null;
  readonly plantInstanceHistory?: string[];
}

export interface Slot extends BaseSlot {
  readonly subSlot?: BaseSlot;
}
