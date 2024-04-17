import { ContainerType, StartedFromType } from '../../interface';
import { SlotDocument } from './container-slot.interface';

export interface ContainerDocument {
  readonly _id: string;
  readonly name: string;
  readonly gardenId: string;
  readonly type: ContainerType;
  readonly rows: number;
  readonly columns: number;
  readonly slots?: Record<string, SlotDocument>;
  readonly startedFrom?: StartedFromType;
  readonly archived?: boolean;
}
