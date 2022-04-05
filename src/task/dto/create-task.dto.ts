import { TaskType } from '../../interface';

export class CreateTaskDTO {
  readonly text: string;
  readonly type: TaskType;
  readonly start: Date;
  readonly due: Date;
  readonly path: string | null;
  readonly completedOn: Date | null;
}
