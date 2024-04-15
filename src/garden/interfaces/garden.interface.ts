import { Document } from 'mongoose';

export interface GardenDocument extends Document {
  readonly userId: string;
  readonly name: string;
  readonly retired?: boolean;
}
