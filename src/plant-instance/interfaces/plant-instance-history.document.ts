import { Document } from 'mongoose';
import { PlantInstanceHistoryProjection } from './plant-instance-history.projection';

export type PlantInstanceHistoryDocument = PlantInstanceHistoryProjection & Document<string>;
