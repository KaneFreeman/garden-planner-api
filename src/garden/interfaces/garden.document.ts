import { Document } from 'mongoose';
import { GardenProjection } from './garden.projection';

export type GardenDocument = GardenProjection & Document<string>;
