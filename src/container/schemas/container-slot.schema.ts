import * as mongoose from 'mongoose';
import { CommentSchema } from '../../common/schemas/comment.schema';
import { PictureDataSchema } from '../../common/schemas/picture-data.schema';
import { TransplantedToSchema } from './transplanted-to.schema';

export const ContainerSlotSchema = new mongoose.Schema({
  plant: String,
  status: String,
  plantedCount: Number,
  plantedDate: { type: Date },
  transplantedDate: { type: Date },
  transplantedTo: TransplantedToSchema,
  pictures: [PictureDataSchema],
  comments: [CommentSchema],
});
