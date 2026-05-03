import mongoose from 'mongoose';

export const UserSchema = new mongoose.Schema({
  email: String,
  firstName: String,
  lastName: String,
  summaryEmail: Boolean,
  zipCode: String
});
