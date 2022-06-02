import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { ContainerDocument } from './interfaces/container.interface';

@Injectable()
export class OldContainerService {
  constructor(
    @InjectModel('old-container')
    private readonly containerModel: Model<ContainerDocument>
  ) {}

  async getContainer(containerId: string | null | undefined): Promise<ContainerDocument | null> {
    if (!containerId) {
      return null;
    }

    return this.containerModel.findById(containerId).exec();
  }

  async getContainers(): Promise<ContainerDocument[]> {
    return this.containerModel.find().exec();
  }
}
