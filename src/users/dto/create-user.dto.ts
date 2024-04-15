import { isNullish } from '../../util/null.util';

export interface CreateUserDTO {
  readonly email: string;
  readonly password: string;
  readonly firstName: string;
  readonly lastName: string;
}

export function sanitizeCreateUserDTO(raw: CreateUserDTO[] | null | undefined): CreateUserDTO[] | undefined;
export function sanitizeCreateUserDTO(raw: CreateUserDTO | null | undefined): CreateUserDTO | undefined;
export function sanitizeCreateUserDTO(
  raw: CreateUserDTO | CreateUserDTO[] | null | undefined
): CreateUserDTO | CreateUserDTO[] | undefined {
  if (isNullish(raw)) {
    return undefined;
  }

  if (!Array.isArray(raw)) {
    return sanitizeCreateUserDTO([raw])?.[0];
  }

  return raw.map((dto) => ({
    email: `${dto.email}`,
    password: `${dto.password}`,
    firstName: `${dto.firstName}`,
    lastName: `${dto.lastName}`
  }));
}
