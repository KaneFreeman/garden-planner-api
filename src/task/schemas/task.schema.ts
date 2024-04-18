import mongoose, { SchemaTypes } from 'mongoose';

export const TaskSchema = new mongoose.Schema({
  text: String,
  type: String,
  start: { type: Date },
  due: { type: Date },
  plantInstanceId: SchemaTypes.ObjectId,
  path: String,
  completedOn: { type: Date },
  gardenId: SchemaTypes.ObjectId
});
