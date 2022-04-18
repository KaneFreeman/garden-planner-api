import parse from 'date-fns/parse';

export function parseDate(date: string) {
  return parse(date, 'MMM d', new Date());
}

export function isValidDate(date: unknown) {
  return date instanceof Date && !Number.isNaN(date) && date.toString() !== 'Invalid Date';
}
