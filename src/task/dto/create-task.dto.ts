import { TaskType, toTaskType } from '../../interface';
import { isNotNullish, isNullish } from '../../util/null.util';

export interface CreateTaskDTO {
  readonly text: string;
  readonly type: TaskType;
  readonly start: Date;
  readonly due: Date;
  readonly plantInstanceId: string | null;
  readonly path: string | null;
  readonly completedOn: Date | null;
  readonly gardenId?: string;
}

export function sanitizeCreateTaskDTO(raw: CreateTaskDTO[] | null | undefined): CreateTaskDTO[] | undefined;
export function sanitizeCreateTaskDTO(raw: CreateTaskDTO | null | undefined): CreateTaskDTO | undefined;
export function sanitizeCreateTaskDTO(
  raw: CreateTaskDTO | CreateTaskDTO[] | null | undefined
): CreateTaskDTO | CreateTaskDTO[] | undefined {
  if (isNullish(raw)) {
    return undefined;
  }

  if (!Array.isArray(raw)) {
    return sanitizeCreateTaskDTO([raw])?.[0];
  }

  return raw.map((dto) => ({
    text: `${dto.text}`,
    type: toTaskType(dto.type),
    start: new Date(dto.start),
    due: new Date(dto.due),
    plantInstanceId: isNotNullish(dto.plantInstanceId) ? `${dto.plantInstanceId}` : null,
    path: isNotNullish(dto.path) ? `${dto.path}` : null,
    completedOn: isNotNullish(dto.completedOn) ? new Date(dto.completedOn) : null
  }));
}
