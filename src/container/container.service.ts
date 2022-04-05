import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { ContainerDTO } from './dto/container.dto';
import { Container } from './interfaces/container.interface';

@Injectable()
export class ContainerService {
  constructor(
    @InjectModel('Container') private readonly containerModel: Model<Container>,
  ) {}

  async addContainer(createContainerDTO: ContainerDTO): Promise<Container> {
    const newContainer = await this.containerModel.create(createContainerDTO);
    return newContainer.save();
  }

  async getContainer(containerId): Promise<Container> {
    const container = await this.containerModel.findById(containerId).exec();
    return container;
  }

  async getContainers(): Promise<Container[]> {
    const containers = await this.containerModel.find().exec();
    return containers;
  }

  async editContainer(
    containerId,
    createContainerDTO: ContainerDTO,
  ): Promise<Container> {
    const editedContainer = await this.containerModel.findByIdAndUpdate(
      containerId,
      createContainerDTO,
      { new: true },
    );
    return editedContainer;
  }

  async deleteContainer(containerId): Promise<Container> {
    const deletedContainer = await this.containerModel.findByIdAndRemove(
      containerId,
    );
    return deletedContainer;
  }
}
