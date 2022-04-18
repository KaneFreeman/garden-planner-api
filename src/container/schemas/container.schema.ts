import mongoose from 'mongoose';
import { ContainerSlotSchema } from './container-slot.schema';

export const ContainerSchema = new mongoose.Schema({
  name: String,
  type: String,
  rows: Number,
  columns: Number,
  slots: {
    type: Map,
    of: ContainerSlotSchema
  }
});
