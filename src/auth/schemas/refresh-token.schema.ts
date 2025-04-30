import mongoose, { SchemaTypes } from 'mongoose';

export const RefreshTokenSchema = new mongoose.Schema({
  userId: SchemaTypes.ObjectId,
  deviceId: String,
  refreshToken: String
});
