import mongoose, { SchemaTypes } from 'mongoose';
import { ContainerSlotSchema } from './container-slot.schema';

export const ContainerSchema = new mongoose.Schema({
  name: String,
  gardenId: SchemaTypes.ObjectId,
  type: String,
  year: Number,
  rows: Number,
  columns: Number,
  slots: {
    type: Map,
    of: ContainerSlotSchema
  },
  startedFrom: String,
  archived: Boolean
});
