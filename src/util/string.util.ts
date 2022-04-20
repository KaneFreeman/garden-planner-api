import { isNotNullish } from './null.util';

export function isNotEmpty(value: string | null | undefined): value is string {
  return isNotNullish(value) && value !== '';
}

export function isEmpty(value: string | null | undefined) {
  return !isNotEmpty(value);
}
