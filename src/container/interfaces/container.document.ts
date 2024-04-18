import { Document } from 'mongoose';
import { ContainerProjection } from './container.projection';

export type ContainerDocument = ContainerProjection & Document<string>;
