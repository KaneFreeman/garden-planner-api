import mongoose from 'mongoose';
import { ContainerSlotIdentifierSchema } from '../../container/schemas/container-slot-identifier.schema';

export const PlantInstanceHistorySchema = new mongoose.Schema({
  from: ContainerSlotIdentifierSchema,
  to: ContainerSlotIdentifierSchema,
  status: String,
  date: { type: Date }
});
