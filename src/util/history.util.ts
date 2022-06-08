import {
  TaskType,
  HistoryStatus,
  HARVEST,
  PLANTED,
  TRANSPLANTED,
  HARVESTED,
  FERTILIZED,
  TRANSPLANT,
  PLANT,
  FERTILIZE,
  CUSTOM
} from '../interface';

export function fromTaskTypeToHistoryStatus(taskType: Omit<TaskType, 'Custom'>): HistoryStatus;
export function fromTaskTypeToHistoryStatus(taskType: typeof CUSTOM): undefined;
export function fromTaskTypeToHistoryStatus(
  taskType: Omit<TaskType, 'Custom'> | typeof CUSTOM
): HistoryStatus | undefined {
  switch (taskType) {
    case PLANT:
      return PLANTED;
    case TRANSPLANT:
      return TRANSPLANTED;
    case HARVEST:
      return HARVESTED;
    case FERTILIZE:
      return FERTILIZED;
    default:
      return undefined;
  }
}

export function fromHistoryStatusToTaskType(taskType: HistoryStatus): TaskType {
  switch (taskType) {
    case PLANTED:
      return PLANT;
    case TRANSPLANTED:
      return TRANSPLANT;
    case HARVESTED:
      return HARVEST;
    case FERTILIZED:
      return FERTILIZE;
  }
}
