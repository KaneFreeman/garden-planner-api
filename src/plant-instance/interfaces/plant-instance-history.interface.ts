import { ContainerSlotIdentifierDocument } from '../../container/interfaces/container-slot-identifier.interface';
import { Status } from '../../interface';

export interface PlantInstanceHistoryDocument {
  from: ContainerSlotIdentifierDocument;
  to?: ContainerSlotIdentifierDocument;
  readonly status: Status;
  readonly date: Date;
}
