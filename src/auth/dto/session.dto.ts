import { isNullish } from '../../util/null.util';

export interface SessionDTO {
  readonly userId: string;
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly accessToken: string;
  readonly refreshToken: string;
}

export function sanitizeSessionDTO(raw: SessionDTO | null | undefined): SessionDTO | undefined {
  if (isNullish(raw)) {
    return undefined;
  }

  return {
    userId: `${raw.userId}`,
    email: `${raw.email}`,
    firstName: `${raw.firstName}`,
    lastName: `${raw.lastName}`,
    accessToken: `${raw.accessToken}`,
    refreshToken: `${raw.refreshToken}`
  };
}
