import { GrowingZoneData } from '../interface';

export function hasFrostDates(data: GrowingZoneData): data is Required<GrowingZoneData> {
  return Boolean(data.firstFrost && data.lastFrost);
}
