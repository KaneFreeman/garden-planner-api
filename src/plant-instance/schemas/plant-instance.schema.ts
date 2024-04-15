import mongoose, { SchemaTypes } from 'mongoose';
import { CommentSchema } from '../../common/schemas/comment.schema';
import { PictureDataSchema } from '../../common/schemas/picture-data.schema';
import { PlantInstanceHistorySchema } from './plant-instance-history.schema';

export const PlantInstanceSchema = new mongoose.Schema({
  containerId: SchemaTypes.ObjectId,
  slotId: Number,
  subSlot: Boolean,
  plant: SchemaTypes.ObjectId,
  created: { type: Date },
  pictures: [PictureDataSchema],
  comments: [CommentSchema],
  history: [PlantInstanceHistorySchema],
  closed: Boolean,
  startedFrom: String,
  season: String,
  plantedCount: Number
});
