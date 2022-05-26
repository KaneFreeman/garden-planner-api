import { Document } from 'mongoose';
import { ContainerType, StartedFromType } from '../../interface';
import { SlotDocument } from './container-slot.interface';

export interface ContainerDocument extends Document<string> {
  readonly name: string;
  readonly type: ContainerType;
  readonly rows: number;
  readonly columns: number;
  readonly slots?: Map<string, SlotDocument>;
  readonly startedFrom?: StartedFromType;
  readonly archived?: boolean;
}
