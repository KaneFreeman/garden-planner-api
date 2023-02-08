import { isNullish } from '../../util/null.util';

export interface BulkReopenClosePlantInstanceDTO {
  readonly plantInstanceIds: string[];
  readonly action: 'reopen' | 'close';
}

export function sanitizeBulkReopenClosePlantInstanceDTO(
  raw: BulkReopenClosePlantInstanceDTO | null | undefined
): BulkReopenClosePlantInstanceDTO | undefined {
  if (isNullish(raw)) {
    return undefined;
  }

  return {
    plantInstanceIds: raw?.plantInstanceIds.map((id) => `${id}`) ?? [],
    action: `${raw?.action}`
  };
}
