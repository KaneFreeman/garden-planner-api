import { Document } from 'mongoose';
import { TaskType } from '../../interface';

export interface TaskDocument extends Document {
  readonly text: string;
  readonly type: TaskType;
  readonly start: Date;
  readonly due: Date;
  readonly plantInstanceId: string;
  readonly path: string | null;
  readonly completedOn: Date | null;
}
