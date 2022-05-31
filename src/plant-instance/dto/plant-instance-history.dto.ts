import { ContainerSlotIdentifierDTO } from '../../container/dto/container-slot-identifier.dto';
import { HistoryStatus } from '../../interface';

export interface PlantInstanceHistoryDto {
  readonly from?: ContainerSlotIdentifierDTO;
  readonly to?: ContainerSlotIdentifierDTO;
  readonly status: HistoryStatus;
  readonly date: string;
}
