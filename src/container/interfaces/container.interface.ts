import { Document } from 'mongoose';
import { SlotDocument } from './slot.interface';

export interface ContainerDocument extends Document {
  readonly name: string;
  readonly rows: number;
  readonly columns: number;
  readonly slots?: Map<string, SlotDocument>;
}
