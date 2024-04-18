import { Document } from 'mongoose';
import { UserProjection } from './user.projection';

export type UserDocument = UserProjection & Document<string>;
