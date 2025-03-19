import mongoose from 'mongoose';

export const ContainerSlotIdentifierSchema = new mongoose.Schema({
  containerId: String,
  slotId: Number
});
