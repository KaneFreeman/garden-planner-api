import { Document } from 'mongoose';

export interface UserDocument extends Document {
  readonly email: string;
  readonly password?: string;
  readonly firstName: string;
  readonly lastName: string;
}
