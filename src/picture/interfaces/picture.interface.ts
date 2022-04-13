import { Document } from 'mongoose';

export interface Picture extends Document {
  readonly dataUrl: string;
}
