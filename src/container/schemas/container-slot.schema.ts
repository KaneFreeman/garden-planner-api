import mongoose from 'mongoose';
import { CommentSchema } from '../../common/schemas/comment.schema';
import { PictureDataSchema } from '../../common/schemas/picture-data.schema';
import { ContainerSlotIdentifierSchema } from './container-slot-identifier.schema';

export const BaseContainerSlotSchema = {
  plant: String,
  status: String,
  plantedCount: Number,
  plantedDate: { type: Date },
  transplantedDate: { type: Date },
  transplantedTo: ContainerSlotIdentifierSchema,
  transplantedFromDate: { type: Date },
  transplantedFrom: ContainerSlotIdentifierSchema,
  firstHarvestDate: { type: Date },
  startedFrom: String,
  pictures: [PictureDataSchema],
  comments: [CommentSchema]
};

export const ContainerSlotSchema = new mongoose.Schema({
  ...BaseContainerSlotSchema,
  subSlot: BaseContainerSlotSchema
});
