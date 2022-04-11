import { Injectable } from '@nestjs/common';
import plantData from '../data/plantData';

@Injectable()
export class StaticService {
  getPlantData() {
    return plantData;
  }
}
