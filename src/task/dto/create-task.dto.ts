import { TaskType } from '../../interface';

export interface CreateTaskDTO {
  readonly text: string;
  readonly type: TaskType;
  readonly start: Date;
  readonly due: Date;
  readonly contaienrId: string;
  readonly path: string | null;
  readonly completedOn: Date | null;
}
