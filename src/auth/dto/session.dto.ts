import { isNullish } from '../../util/null.util';

export interface SessionDTO {
  readonly userId: string;
  readonly email: string;
  readonly accessToken: string;
}

export function sanitizeSessionDTO(raw: SessionDTO | null | undefined): SessionDTO | undefined {
  if (isNullish(raw)) {
    return undefined;
  }

  return {
    userId: `${raw.userId}`,
    email: `${raw.email}`,
    accessToken: `${raw.accessToken}`
  };
}
