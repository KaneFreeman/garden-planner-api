import parse from 'date-fns/parse';

export function parseDate(date: string) {
  return parse(date, 'MMM d', new Date());
}
