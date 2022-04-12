import { ContainerType } from '../../interface';
import { ContainerSlotDTO } from './container-slot.dto';

export class ContainerDTO {
  readonly name: string;
  readonly type: ContainerType;
  readonly rows: number;
  readonly columns: number;
  readonly slots?: Record<string, ContainerSlotDTO>;
}
