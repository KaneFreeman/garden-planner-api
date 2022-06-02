/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { TaskService } from '../task/task.service';
import { PlantInstanceService } from '../plant-instance/plant-instance.service';
import { ContainerService } from '../container/container.service';
import { OldContainerService } from './old-container.service';
import { OldTaskService } from './old-task.service';
import {
  ContainerSlotIdentifier,
  FERTILIZE,
  FERTILIZED,
  PLANTED,
  STARTED_FROM_TYPE_SEED,
  TRANSPLANTED
} from '../interface';
import { PlantInstanceHistoryDto } from '../plant-instance/dto/plant-instance-history.dto';
import { PlantInstanceDTO } from '../plant-instance/dto/plant-instance.dto';
import { SlotDocument } from './interfaces/slot.interface';
import { ContainerDocument } from './interfaces/container.interface';
import { TaskDocument } from './interfaces/task.interface';
import { ContainerDTO } from '../container/dto/container.dto';
import { isNotNullish } from '../util/null.util';

@Injectable()
export class MigrationService {
  constructor(
    @Inject(forwardRef(() => OldContainerService)) private oldContainerService: OldContainerService,
    @Inject(forwardRef(() => OldTaskService)) private oldTaskService: OldTaskService,
    @Inject(forwardRef(() => ContainerService)) private containerService: ContainerService,
    @Inject(forwardRef(() => PlantInstanceService)) private plantInstanceService: PlantInstanceService,
    @Inject(forwardRef(() => TaskService)) private taskService: TaskService
  ) {}

  async buildPlantInstance(
    finalSlot: { location: ContainerSlotIdentifier; slot: SlotDocument; container: ContainerDocument },
    transplants: PlantInstanceHistoryDto[]
  ): Promise<{ locations: ContainerSlotIdentifier[]; tasks: TaskDocument[]; instance: PlantInstanceDTO }> {
    const { location: finalLocation, slot, container } = finalSlot;
    const { plant, startedFrom, plantedCount, plantedDate } = slot;

    const plantInstance: Omit<PlantInstanceDTO, 'history'> = {
      created: plantedDate?.toISOString() ?? new Date().toISOString(),
      plant: plant ?? null,
      startedFrom: startedFrom ?? container.startedFrom ?? STARTED_FROM_TYPE_SEED,
      plantedCount: plantedCount ?? 1,
      ...finalLocation
    };

    if (!plantedDate) {
      return {
        locations: [finalLocation],
        tasks: [],
        instance: {
          ...plantInstance,
          history: []
        }
      };
    }

    const { locations, history: transplantHistory } = this.buildTransplantHistory(finalLocation, transplants);
    const location = locations.length > 0 ? locations[0] : finalLocation;
    const filteredLocations = locations.filter((value, index, self) => {
      return (
        self.findIndex(
          (other) =>
            other.containerId === value.containerId && other.slotId === value.slotId && other.subSlot === value.subSlot
        ) === index
      );
    });

    let tasks: TaskDocument[] = [];
    for (const otherLocation of filteredLocations) {
      const path = `/container/${otherLocation.containerId}/slot/${otherLocation.slotId}${
        otherLocation.subSlot ? '/sub-slot' : ''
      }`;
      tasks.push(...(await this.oldTaskService.getTasksByPath(path)));
    }
    tasks = tasks.filter((task) => isNotNullish(task.completedOn));

    const fertilizeTasks: { location: ContainerSlotIdentifier; task: TaskDocument }[] = [];
    for (const otherLocation of filteredLocations) {
      const path = `/container/${otherLocation.containerId}/slot/${otherLocation.slotId}${
        otherLocation.subSlot ? '/sub-slot' : ''
      }`;
      fertilizeTasks.push(
        ...(await this.oldTaskService.getTasksByTypeAndPath(FERTILIZE, path)).map((task) => ({
          location: otherLocation,
          task
        }))
      );
    }

    for (const { location: otherLocation, task } of fertilizeTasks) {
      if (!task.completedOn) {
        continue;
      }

      const event: PlantInstanceHistoryDto = {
        status: FERTILIZED,
        from: otherLocation,
        date: task.completedOn.toISOString()
      };

      let inserted = false;

      for (let i = transplantHistory.length - 1; i > 0; i--) {
        const history = transplantHistory[i];
        if (new Date(history.date).getTime() > task.completedOn.getTime()) {
          transplantHistory.splice(i, 0, event);
          inserted = true;
          break;
        }
      }

      if (!inserted) {
        transplantHistory.push(event);
      }
    }

    return {
      locations: filteredLocations,
      tasks,
      instance: {
        ...plantInstance,
        history: [
          {
            to: location,
            status: PLANTED,
            date: plantedDate.toISOString()
          },
          ...transplantHistory
        ]
      }
    };
  }

  buildTransplantHistory(
    location: ContainerSlotIdentifier | undefined | null,
    transplants: PlantInstanceHistoryDto[]
  ): { locations: ContainerSlotIdentifier[]; history: PlantInstanceHistoryDto[] } {
    if (!location) {
      return { locations: [], history: [] };
    }

    for (const transplant of transplants) {
      if (transplant.to) {
        if (
          transplant.to.containerId === location.containerId &&
          transplant.to.slotId === location.slotId &&
          transplant.to.subSlot === location.subSlot
        ) {
          const { locations, history } = this.buildTransplantHistory(transplant.from, transplants);
          return { locations: [...locations, location], history: [...history, transplant] };
        }
      }
    }

    return { locations: [location], history: [] };
  }

  async migrate(): Promise<void> {
    const containers = await this.containerService.getContainers();
    const containersById = containers.reduce((acc, container) => {
      if (container._id) {
        const containerDto = container.toObject<ContainerDTO>();
        acc[container._id] = {
          name: containerDto.name,
          type: containerDto.type,
          rows: containerDto.rows,
          columns: containerDto.columns,
          slots: {},
          startedFrom: containerDto.startedFrom ?? STARTED_FROM_TYPE_SEED,
          archived: containerDto.archived ?? false
        };
      }
      return acc;
    }, {} as Record<string, ContainerDTO>);

    const oldContainers = await this.oldContainerService.getContainers();

    const transplants: PlantInstanceHistoryDto[] = [];
    const initialSlots: { location: ContainerSlotIdentifier; slot: SlotDocument; container: ContainerDocument }[] = [];

    for (const oldContainer of oldContainers) {
      oldContainer.slots?.forEach((slot, key) => {
        if (slot.plant) {
          if (slot.transplantedFrom && slot.transplantedFromDate) {
            transplants.push({
              from: {
                containerId: slot.transplantedFrom.containerId,
                slotId: slot.transplantedFrom.slotId,
                subSlot: slot.transplantedFrom.subSlot ?? false
              },
              to: {
                containerId: oldContainer._id.toString(),
                slotId: +key,
                subSlot: false
              },
              status: TRANSPLANTED,
              date: slot.transplantedFromDate.toISOString()
            });
          }

          if (slot.status === TRANSPLANTED && slot.transplantedDate) {
            if (slot.transplantedTo) {
              transplants.push({
                from: {
                  containerId: oldContainer._id.toString(),
                  slotId: +key,
                  subSlot: false
                },
                to: {
                  containerId: slot.transplantedTo.containerId,
                  slotId: slot.transplantedTo.slotId,
                  subSlot: slot.transplantedTo.subSlot ?? false
                },
                status: TRANSPLANTED,
                date: slot.transplantedDate.toISOString()
              });
            } else {
              transplants.push({
                from: {
                  containerId: oldContainer._id.toString(),
                  slotId: +key,
                  subSlot: false
                },
                status: TRANSPLANTED,
                date: slot.transplantedDate.toISOString()
              });
            }
          } else {
            initialSlots.push({
              location: {
                containerId: oldContainer._id.toString(),
                slotId: +key,
                subSlot: false
              },
              slot,
              container: oldContainer
            });
          }
        }

        const subSlot = slot.subSlot;
        if (subSlot && subSlot.plant) {
          if (subSlot.transplantedFrom && subSlot.transplantedFromDate) {
            transplants.push({
              from: {
                containerId: subSlot.transplantedFrom.containerId,
                slotId: subSlot.transplantedFrom.slotId,
                subSlot: subSlot.transplantedFrom.subSlot ?? false
              },
              to: {
                containerId: oldContainer._id.toString(),
                slotId: +key,
                subSlot: true
              },
              status: TRANSPLANTED,
              date: subSlot.transplantedFromDate.toISOString()
            });
          } else {
            initialSlots.push({
              location: {
                containerId: oldContainer._id.toString(),
                slotId: +key,
                subSlot: true
              },
              slot: subSlot,
              container: oldContainer
            });
          }

          if (subSlot.status === TRANSPLANTED && subSlot.transplantedDate) {
            if (subSlot.transplantedTo) {
              transplants.push({
                from: {
                  containerId: oldContainer._id.toString(),
                  slotId: +key,
                  subSlot: true
                },
                to: {
                  containerId: subSlot.transplantedTo.containerId,
                  slotId: subSlot.transplantedTo.slotId,
                  subSlot: subSlot.transplantedTo.subSlot ?? false
                },
                status: TRANSPLANTED,
                date: subSlot.transplantedDate.toISOString()
              });
            } else {
              transplants.push({
                from: {
                  containerId: oldContainer._id.toString(),
                  slotId: +key,
                  subSlot: true
                },
                status: TRANSPLANTED,
                date: subSlot.transplantedDate.toISOString()
              });
            }
          }
        }
      });
    }

    for (const slot of initialSlots) {
      const { locations, tasks, instance } = await this.buildPlantInstance(slot, transplants);

      const plantInstance = await this.plantInstanceService.addPlantInstance(instance, false);
      if (!plantInstance._id) {
        continue;
      }

      for (const task of tasks) {
        await this.taskService.addTask({
          text: task.text,
          type: task.type,
          start: task.start,
          due: task.due,
          plantInstanceId: plantInstance._id?.toString(),
          path: task.path,
          completedOn: task.completedOn
        });
      }

      await this.plantInstanceService.createUpdatePlantInstanceTasks(plantInstance);

      for (const location of locations) {
        let container = containersById[location.containerId];
        if (!container) {
          continue;
        }

        if (!container.slots) {
          container = {
            ...container,
            slots: {}
          };
        }

        if (location.subSlot) {
          container.slots![location.slotId] = {
            ...(container.slots![location.slotId] ?? {}),
            subSlot: {
              plantInstanceId: plantInstance._id?.toString()
            }
          };
        } else {
          container.slots![location.slotId] = {
            ...(container.slots![location.slotId] ?? {}),
            plantInstanceId: plantInstance._id?.toString()
          };
        }

        containersById[location.containerId] = container;
      }
    }

    for (const containerId in containersById) {
      const container = containersById[containerId];
      await this.containerService.editContainer(containerId, container, false);

      console.log('containersToCreate', containerId, containersById[containerId].slots);
    }
  }

  async onModuleInit() {
    // console.log('migrating!');
    // await this.migrate();
  }
}
