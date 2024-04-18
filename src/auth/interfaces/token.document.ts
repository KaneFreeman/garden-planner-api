import { Document } from 'mongoose';
import { TokenProjection } from './token.projection';

export type TokenDocument = TokenProjection & Document<string>;
