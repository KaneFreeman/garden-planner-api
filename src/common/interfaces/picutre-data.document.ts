import { Document } from 'mongoose';
import { PictureDataProjection } from './picutre-data.projection';

export type PictureDataDocument = PictureDataProjection & Document<string>;
