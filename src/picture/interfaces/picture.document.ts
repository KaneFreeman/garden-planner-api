import { Document } from 'mongoose';
import { PictureProjection } from './picture.projection';

export type PictureDocument = PictureProjection & Document<string>;
