import mongoose from 'mongoose';

export const PictureDataSchema = new mongoose.Schema({
  date: { type: Date },
  id: Number,
  pictureId: String,
  thumbnail: String,
  deleted: Boolean
});
