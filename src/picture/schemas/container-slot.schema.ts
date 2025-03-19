import mongoose from 'mongoose';
import { CommentSchema } from '../../common/schemas/comment.schema';
import { PictureDataSchema } from '../../common/schemas/picture-data.schema';

export const ContainerSlotSchema = new mongoose.Schema({
  plant: String,
  status: String,
  plantedDate: { type: Date },
  transplantedDate: { type: Date },
  pictures: [PictureDataSchema],
  comments: [CommentSchema]
});
