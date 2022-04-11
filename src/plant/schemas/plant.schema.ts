import mongoose from 'mongoose';
import { CommentSchema } from '../../common/schemas/comment.schema';
import { PictureDataSchema } from '../../common/schemas/picture-data.schema';

export const PlantSchema = new mongoose.Schema({
  name: String,
  type: String,
  url: String,
  daysToMaturity: [Number],
  pictures: [PictureDataSchema],
  comments: [CommentSchema],
});
