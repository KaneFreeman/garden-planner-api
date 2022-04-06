import { Document } from 'mongoose';
import { Slot } from '../../interface';

export interface Container extends Document {
  name: string;
  rows: number;
  columns: number;
  slots?: Map<string, Slot>;
}
