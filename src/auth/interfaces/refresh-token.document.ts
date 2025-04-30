import { Document } from 'mongoose';
import { RefreshTokenProjection } from './refresh-token.projection';

export type RefreshTokenDocument = RefreshTokenProjection & Document<string>;
