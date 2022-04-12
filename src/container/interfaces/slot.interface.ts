import { Document } from 'mongoose';
import { CommentDocument } from '../../common/interfaces/comment.interface';
import { PictureDataDocument } from '../../common/interfaces/picutre-data.interface';
import { Status } from '../../interface';
import { ContainerSlotIdentifier } from './container-slot-identifier.interface';

export interface SlotDocument extends Document {
  readonly plant?: string;
  readonly status?: Status;
  readonly plantedCount?: number;
  readonly plantedDate?: Date;
  readonly transplantedDate?: Date;
  readonly transplantedTo?: ContainerSlotIdentifier;
  readonly transplantedFrom?: ContainerSlotIdentifier;
  readonly firstHarvestDate?: Date;
  readonly comments?: CommentDocument[];
  readonly pictures?: PictureDataDocument[];
}
