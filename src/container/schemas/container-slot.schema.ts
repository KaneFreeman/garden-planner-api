import mongoose from 'mongoose';

export const BaseContainerSlotSchema = {
  plantInstanceId: String,
  plantInstanceHistory: [String]
};

export const ContainerSlotSchema = new mongoose.Schema({
  ...BaseContainerSlotSchema,
  subSlot: BaseContainerSlotSchema
});
