import mongoose, { SchemaTypes } from 'mongoose';

export const PictureSchema = new mongoose.Schema({
  userId: SchemaTypes.ObjectId,
  dataUrl: String
});
