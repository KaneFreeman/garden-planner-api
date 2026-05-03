import { isNotNullish, isNullish } from '../../util/null.util';

export interface UserDTO {
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly summaryEmail: boolean;
  readonly zipCode: string;
}

export function sanitizeUserDTO(raw: UserDTO[]): UserDTO[];
export function sanitizeUserDTO(raw: UserDTO[] | null | undefined): UserDTO[] | undefined;
export function sanitizeUserDTO(raw: UserDTO): UserDTO;
export function sanitizeUserDTO(raw: UserDTO | null | undefined): UserDTO | undefined;
export function sanitizeUserDTO(raw: UserDTO | UserDTO[] | null | undefined): UserDTO | UserDTO[] | undefined {
  if (isNullish(raw)) {
    return undefined;
  }

  if (!Array.isArray(raw)) {
    return sanitizeUserDTO([raw])?.[0];
  }

  return raw.map((dto) => ({
    email: `${dto.email?.trim()}`,
    firstName: `${dto.firstName?.trim()}`,
    lastName: `${dto.lastName?.trim()}`,
    summaryEmail: isNotNullish(dto.summaryEmail) ? Boolean(dto.summaryEmail) : true,
    zipCode: `${dto.zipCode?.trim()}`
  }));
}
