import mongoose from 'mongoose';
import { CommentSchema } from '../../common/schemas/comment.schema';
import { PictureDataSchema } from '../../common/schemas/picture-data.schema';
import { TransplantedSchema } from './transplanted.schema';

export const ContainerSlotSchema = new mongoose.Schema({
  plant: String,
  status: String,
  plantedCount: Number,
  plantedDate: { type: Date },
  transplantedDate: { type: Date },
  transplantedTo: TransplantedSchema,
  transplantedFrom: TransplantedSchema,
  pictures: [PictureDataSchema],
  comments: [CommentSchema],
});
