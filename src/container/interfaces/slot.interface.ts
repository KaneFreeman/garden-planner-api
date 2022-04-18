import { Document } from 'mongoose';
import { CommentDocument } from '../../common/interfaces/comment.interface';
import { PictureDataDocument } from '../../common/interfaces/picutre-data.interface';
import { StartedFromType, Status } from '../../interface';
import { ContainerSlotIdentifier } from './container-slot-identifier.interface';

export interface BaseSlotDocument extends Document {
  readonly plant?: string | null;
  readonly status?: Status;
  readonly plantedCount?: number;
  readonly plantedDate?: Date;
  readonly transplantedDate?: Date;
  readonly transplantedTo: ContainerSlotIdentifier | null;
  readonly transplantedFrom: ContainerSlotIdentifier | null;
  readonly firstHarvestDate?: Date;
  readonly startedFrom: StartedFromType;
  readonly comments?: CommentDocument[];
  readonly pictures?: PictureDataDocument[];
}

export interface SlotDocument extends BaseSlotDocument {
  readonly subSlot?: BaseSlotDocument;
}
