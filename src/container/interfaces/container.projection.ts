import { ContainerType, StartedFromType } from '../../interface';
import { Slot } from './container-slot.interface';

export interface ContainerProjection {
  readonly _id: string;
  readonly name: string;
  readonly gardenId: string;
  readonly type: ContainerType;
  readonly year?: number;
  readonly rows: number;
  readonly columns: number;
  readonly slots?: Record<string, Slot>;
  readonly startedFrom?: StartedFromType;
  readonly archived?: boolean;
}
