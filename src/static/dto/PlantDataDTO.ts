import format from 'date-fns/format';
import subDays from 'date-fns/subDays';
import growingZoneData from '../../data/growingZoneData';
import { PlantData } from '../../interface';

function dateToString(anchorDate: Date, daysDiff: number) {
  return format(subDays(anchorDate, daysDiff), 'MMM d');
}

export class PlantDataDTO {
  howToGrow: {
    spring?: {
      indoor?: {
        min: string;
        max: string;
        transplant_min: string;
        transplant_max: string;
        transplant_days_min: number;
        transplant_days_max: number;
      };
      plant?: {
        min: string;
        max: string;
      };
      outdoor?: {
        min: string;
        max: string;
      };
    };
    fall?: {
      indoor?: {
        min: string;
        max: string;
        transplant_min: string;
        transplant_max: string;
        transplant_days_min: number;
        transplant_days_max: number;
      };
      plant?: {
        min: string;
        max: string;
      };
      outdoor?: {
        min: string;
        max: string;
      };
    };
  };
  faq: {
    how_to_grow?: [string, string][];
  };

  static toDTO(data: PlantData): PlantDataDTO {
    const howToGrow: PlantDataDTO['howToGrow'] = {};

    if (data.howToGrow.spring) {
      howToGrow.spring = {};

      if (data.howToGrow.spring.indoor) {
        howToGrow.spring.indoor = {
          min: dateToString(
            growingZoneData.lastFrost,
            data.howToGrow.spring.indoor.min,
          ),
          max: dateToString(
            growingZoneData.lastFrost,
            data.howToGrow.spring.indoor.max,
          ),
          transplant_min: dateToString(
            growingZoneData.lastFrost,
            data.howToGrow.spring.indoor.min -
              data.howToGrow.spring.indoor.transplant_min,
          ),
          transplant_max: dateToString(
            growingZoneData.lastFrost,
            data.howToGrow.spring.indoor.max -
              data.howToGrow.spring.indoor.transplant_max,
          ),
          transplant_days_min: data.howToGrow.spring.indoor.transplant_min,
          transplant_days_max: data.howToGrow.spring.indoor.transplant_max,
        };
      }

      if (data.howToGrow.spring.plant) {
        howToGrow.spring.plant = {
          min: dateToString(
            growingZoneData.lastFrost,
            data.howToGrow.spring.plant.min,
          ),
          max: dateToString(
            growingZoneData.lastFrost,
            data.howToGrow.spring.plant.max,
          ),
        };
      }

      if (data.howToGrow.spring.outdoor) {
        howToGrow.spring.outdoor = {
          min: dateToString(
            growingZoneData.lastFrost,
            data.howToGrow.spring.outdoor.min,
          ),
          max: dateToString(
            growingZoneData.lastFrost,
            data.howToGrow.spring.outdoor.max,
          ),
        };
      }
    }

    if (data.howToGrow.fall) {
      howToGrow.fall = {};

      if (data.howToGrow.fall.indoor) {
        howToGrow.fall.indoor = {
          min: dateToString(
            growingZoneData.firstFrost,
            data.howToGrow.fall.indoor.min,
          ),
          max: dateToString(
            growingZoneData.firstFrost,
            data.howToGrow.fall.indoor.max,
          ),
          transplant_min: dateToString(
            growingZoneData.firstFrost,
            data.howToGrow.fall.indoor.min -
              data.howToGrow.fall.indoor.transplant_min,
          ),
          transplant_max: dateToString(
            growingZoneData.firstFrost,
            data.howToGrow.fall.indoor.max -
              data.howToGrow.fall.indoor.transplant_max,
          ),
          transplant_days_min: data.howToGrow.fall.indoor.transplant_min,
          transplant_days_max: data.howToGrow.fall.indoor.transplant_max,
        };
      }

      if (data.howToGrow.fall.plant) {
        howToGrow.fall.plant = {
          min: dateToString(
            growingZoneData.firstFrost,
            data.howToGrow.fall.plant.min,
          ),
          max: dateToString(
            growingZoneData.firstFrost,
            data.howToGrow.fall.plant.max,
          ),
        };
      }

      if (data.howToGrow.fall.outdoor) {
        howToGrow.fall.outdoor = {
          min: dateToString(
            growingZoneData.firstFrost,
            data.howToGrow.fall.outdoor.min,
          ),
          max: dateToString(
            growingZoneData.firstFrost,
            data.howToGrow.fall.outdoor.max,
          ),
        };
      }
    }

    return {
      howToGrow,
      faq: data.faq,
    };
  }
}
