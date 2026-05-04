import { TaskType } from '../../interface';

export interface TaskProjection {
  readonly _id: string;
  readonly text: string;
  readonly type: TaskType;
  readonly start: Date;
  readonly due: Date;
  readonly plantInstanceId: string | null;
  readonly path: string | null;
  readonly completedOn: Date | null;
}
