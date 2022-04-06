import { parse } from 'date-fns';

export function parseDate(date: string) {
  return parse(date, 'MMM d', new Date());
}
