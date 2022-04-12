import { Document } from 'mongoose';
import { ContainerType } from '../../interface';
import { SlotDocument } from './slot.interface';

export interface ContainerDocument extends Document {
  readonly name: string;
  readonly type: ContainerType;
  readonly rows: number;
  readonly columns: number;
  readonly slots?: Map<string, SlotDocument>;
}
