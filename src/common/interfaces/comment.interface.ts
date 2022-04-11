import { Document } from 'mongoose';

export interface CommentDocument extends Document {
  readonly date: string;
  readonly text: string;
}
