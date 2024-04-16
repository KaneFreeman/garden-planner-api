import { isNullish } from '../../util/null.util';

export interface GenerateTokenDTO {
  readonly email: string;
}

export function sanitizeGenerateTokenDTO(raw: GenerateTokenDTO): GenerateTokenDTO;
export function sanitizeGenerateTokenDTO(raw: GenerateTokenDTO | null | undefined): GenerateTokenDTO | undefined;
export function sanitizeGenerateTokenDTO(raw: GenerateTokenDTO | null | undefined): GenerateTokenDTO | undefined {
  if (isNullish(raw)) {
    return undefined;
  }

  return {
    email: `${(raw.email ?? '').trim()}`
  };
}
