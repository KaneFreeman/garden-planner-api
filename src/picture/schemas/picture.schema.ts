import * as mongoose from 'mongoose';

export const PictureSchema = new mongoose.Schema({
  dataUrl: String,
});
