import { ContainerSlotIdentifierDTO } from '../../container/dto/container-slot-identifier.dto';
import { Status } from '../../interface';

export interface PlantInstanceHistoryDto {
  readonly from: ContainerSlotIdentifierDTO;
  readonly to?: ContainerSlotIdentifierDTO;
  readonly status: Status;
  readonly date: string;
}
