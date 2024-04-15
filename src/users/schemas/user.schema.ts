import mongoose from 'mongoose';

export const UserSchema = new mongoose.Schema({
  email: String,
  password: { type: String, select: false }
});
