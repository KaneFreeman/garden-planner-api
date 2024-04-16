import { Document } from 'mongoose';

export interface TokenDocument extends Document {
  readonly userId: string;
  readonly email: string;
  readonly token: string;
  readonly expires: Date;
}
