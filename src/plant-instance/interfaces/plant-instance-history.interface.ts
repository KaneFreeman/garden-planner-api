import { ContainerSlotIdentifierDocument } from '../../container/interfaces/container-slot-identifier.interface';
import { HistoryStatus } from '../../interface';

export interface PlantInstanceHistoryDocument {
  readonly from?: ContainerSlotIdentifierDocument;
  readonly to?: ContainerSlotIdentifierDocument;
  readonly status: HistoryStatus;
  readonly date: Date;
}
