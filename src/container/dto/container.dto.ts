import { ContainerType, StartedFromType } from '../../interface';
import { ContainerSlotDTO } from './container-slot.dto';

export interface ContainerDTO {
  readonly name: string;
  readonly type: ContainerType;
  readonly rows: number;
  readonly columns: number;
  readonly slots?: Record<string, ContainerSlotDTO>;
  readonly startedFrom?: StartedFromType;
}
