import mongoose, { SchemaTypes } from 'mongoose';

export const TokenSchema = new mongoose.Schema({
  userId: SchemaTypes.ObjectId,
  email: String,
  token: String,
  expires: Date
});
