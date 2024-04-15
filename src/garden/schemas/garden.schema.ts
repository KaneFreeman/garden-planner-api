import mongoose, { SchemaTypes } from 'mongoose';

export const GardenSchema = new mongoose.Schema({
  userId: { type: SchemaTypes.ObjectId, select: false },
  name: String,
  retired: Boolean
});
