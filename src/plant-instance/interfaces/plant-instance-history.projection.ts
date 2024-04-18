import { ContainerSlotIdentifier } from '../../container/interfaces/container-slot-identifier.interface';
import { HistoryStatus } from '../../interface';

export interface PlantInstanceHistoryProjection {
  readonly from?: ContainerSlotIdentifier;
  readonly to?: ContainerSlotIdentifier;
  readonly status: HistoryStatus;
  readonly date: Date;
}
