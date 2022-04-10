import * as mongoose from 'mongoose';

export const TransplantedToSchema = new mongoose.Schema({
  containerId: String,
  slotId: Number,
});
