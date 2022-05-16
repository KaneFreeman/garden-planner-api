import { Document } from 'mongoose';

export interface CommentDocument extends Document {
  readonly date: Date;
  readonly text: string;
}
