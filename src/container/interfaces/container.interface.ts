import { Document } from 'mongoose';
import { ContainerType, StartedFromType } from '../../interface';
import { SlotDocument } from './slot.interface';

export interface ContainerDocument extends Document {
  readonly name: string;
  readonly type: ContainerType;
  readonly rows: number;
  readonly columns: number;
  readonly slots?: Map<string, SlotDocument>;
  readonly startedFrom?: StartedFromType;
  readonly archived?: boolean;
}
