import mongoose from 'mongoose';

export const CommentSchema = new mongoose.Schema({
  date: { type: Date },
  text: String,
});
