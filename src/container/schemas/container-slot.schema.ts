import mongoose from 'mongoose';
import { CommentSchema } from '../../common/schemas/comment.schema';
import { PictureDataSchema } from '../../common/schemas/picture-data.schema';
import { TransplantedSchema } from './transplanted.schema';

export const BaseContainerSlotSchema = {
  plant: String,
  status: String,
  plantedCount: Number,
  plantedDate: { type: Date },
  transplantedDate: { type: Date },
  transplantedTo: TransplantedSchema,
  transplantedFrom: TransplantedSchema,
  firstHarvestDate: { type: Date },
  pictures: [PictureDataSchema],
  comments: [CommentSchema],
};

export const ContainerSlotSchema = new mongoose.Schema({
  ...BaseContainerSlotSchema,
  subSlot: BaseContainerSlotSchema,
});
