import mongoose from 'mongoose';

export const TaskSchema = new mongoose.Schema({
  text: String,
  type: String,
  start: { type: Date },
  due: { type: Date },
  plantInstanceId: String,
  path: String,
  completedOn: { type: Date },
  gardenId: String
});
