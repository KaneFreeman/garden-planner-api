import { isNullish } from '../../util/null.util';

export interface ValidateTokenDTO {
  readonly email: string;
  readonly token: string;
}

export function sanitizeValidateTokenDTO(raw: ValidateTokenDTO): ValidateTokenDTO;
export function sanitizeValidateTokenDTO(raw: ValidateTokenDTO | null | undefined): ValidateTokenDTO | undefined;
export function sanitizeValidateTokenDTO(raw: ValidateTokenDTO | null | undefined): ValidateTokenDTO | undefined {
  if (isNullish(raw)) {
    return undefined;
  }

  return {
    email: `${raw.email.trim()}`,
    token: `${raw.token.trim()}`
  };
}
