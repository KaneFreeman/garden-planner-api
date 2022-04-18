import mongoose from 'mongoose';

export const TransplantedSchema = new mongoose.Schema({
  containerId: String,
  slotId: Number
});
