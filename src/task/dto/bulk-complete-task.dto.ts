import { TaskType, toTaskType } from '../../interface';
import { isNullish } from '../../util/null.util';

export interface BulkCompleteTaskDTO {
  readonly taskIds: string[];
  readonly date: string;
  readonly type: TaskType;
}

export function sanitizeBulkCompleteTaskDTO(
  raw: BulkCompleteTaskDTO[] | null | undefined
): BulkCompleteTaskDTO[] | undefined;
export function sanitizeBulkCompleteTaskDTO(
  raw: BulkCompleteTaskDTO | null | undefined
): BulkCompleteTaskDTO | undefined;
export function sanitizeBulkCompleteTaskDTO(
  raw: BulkCompleteTaskDTO | BulkCompleteTaskDTO[] | null | undefined
): BulkCompleteTaskDTO | BulkCompleteTaskDTO[] | undefined {
  if (isNullish(raw)) {
    return undefined;
  }

  if (!Array.isArray(raw)) {
    return sanitizeBulkCompleteTaskDTO([raw])?.[0];
  }

  return raw.map((dto) => ({
    taskIds: dto.taskIds.map((id) => `${id}`),
    date: `${dto.date}`,
    type: toTaskType(dto.type)
  }));
}
