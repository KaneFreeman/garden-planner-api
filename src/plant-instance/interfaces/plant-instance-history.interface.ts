import { ContainerSlotIdentifierDocument } from '../../container/interfaces/container-slot-identifier.interface';
import { Status } from '../../interface';

export interface PlantInstanceHistoryDocument {
  readonly from: ContainerSlotIdentifierDocument;
  readonly to?: ContainerSlotIdentifierDocument;
  readonly status: Status;
  readonly date: Date;
}
