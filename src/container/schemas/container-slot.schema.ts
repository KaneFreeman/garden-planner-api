import mongoose from 'mongoose';

export const BaseContainerSlotSchema = {
  plant: String,
  plantInstanceId: String,
  plantInstanceHistory: [String]
};

export const ContainerSlotSchema = new mongoose.Schema({
  ...BaseContainerSlotSchema,
  subSlot: BaseContainerSlotSchema
});
