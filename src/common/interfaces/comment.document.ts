import { Document } from 'mongoose';
import { CommentProjection } from './comment.projection';

export type CommentDocument = CommentProjection & Document<string>;
