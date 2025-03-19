export interface Slot {
  readonly _id: string;
  readonly plant?: string | null;
  readonly plantInstanceId?: string | null;
  readonly plantInstanceHistory?: string[];
}
