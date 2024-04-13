import { isNullish } from '../../util/null.util';

export interface LoginDTO {
  readonly email: string;
  readonly password: string;
}

export function sanitizeLoginDTO(raw: LoginDTO | null | undefined): LoginDTO | undefined {
  if (isNullish(raw)) {
    return undefined;
  }

  return {
    email: `${raw.email}`,
    password: `${raw.password}`
  };
}
