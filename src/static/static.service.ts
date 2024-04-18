import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import plantData from '../data/plantData';
import { UserService } from '../users/user.service';
import mapRecord from '../util/record.util';
import { PlantDataDTO } from './dto/PlantDataDTO';

@Injectable()
export class StaticService {
  constructor(
    private logger: Logger,
    @Inject(forwardRef(() => UserService)) private userService: UserService
  ) {}

  async getPlantData(userId: string): Promise<Record<string, PlantDataDTO>> {
    const growingZoneData = await this.userService.getGrowingZoneData(userId);
    if (!growingZoneData) {
      return {};
    }

    return mapRecord(plantData, (data) => PlantDataDTO.toDTO(data, growingZoneData)) ?? {};
  }
}
