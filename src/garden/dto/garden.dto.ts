import { isNotNullish, isNullish } from '../../util/null.util';

export interface GardenDTO {
  readonly name: string;
  readonly retired?: boolean;
}

export function sanitizeGardenDTO(raw: GardenDTO | null | undefined): GardenDTO | undefined {
  if (isNullish(raw)) {
    return undefined;
  }

  return {
    name: `${raw.name}`,
    retired: isNotNullish(raw.retired) ? Boolean(raw.retired) : false
  };
}
