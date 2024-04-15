import mongoose, { SchemaTypes } from 'mongoose';
import { CommentSchema } from '../../common/schemas/comment.schema';
import { PictureDataSchema } from '../../common/schemas/picture-data.schema';

export const PlantSchema = new mongoose.Schema({
  name: String,
  type: String,
  url: String,
  daysToGerminate: [Number],
  daysToMaturity: [Number],
  maturityFrom: String,
  pictures: [PictureDataSchema],
  comments: [CommentSchema],
  userId: { type: SchemaTypes.ObjectId, select: false },
  retired: Boolean
});
