export const NOT_PLANTED = 'Not Planted';
export const PLANTED = 'Planted';
export const TRANSPLANTED = 'Transplanted';
export const HARVESTED = 'Harvested';
export type Status = typeof NOT_PLANTED | typeof PLANTED | typeof TRANSPLANTED | typeof HARVESTED;
export const STATUSES: Status[] = [NOT_PLANTED, PLANTED, TRANSPLANTED, HARVESTED];
