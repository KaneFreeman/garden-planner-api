import { ContainerSlotDTO } from './container-slot.dto';

export class ContainerDTO {
  readonly name: string;
  readonly rows: number;
  readonly columns: number;
  readonly slots?: Record<string, ContainerSlotDTO>;
}
