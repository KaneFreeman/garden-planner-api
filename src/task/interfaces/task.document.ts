import { Document } from 'mongoose';
import { TaskProjection } from './task.projection';

export type TaskDocument = TaskProjection & { readonly gardenId: string } & Document<string>;
