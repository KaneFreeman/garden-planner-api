import { Document } from 'mongoose';

export interface Picture extends Document {
  dataUrl: string;
}
