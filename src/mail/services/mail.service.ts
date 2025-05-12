import { MailerService } from '@nestjs-modules/mailer';
import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { endOfDay, format, formatDistance, startOfDay } from 'date-fns';
import { ContainerService } from '../../container/container.service';
import { GardenService } from '../../garden/garden.service';
import { PlantInstanceService } from '../../plant-instance/plant-instance.service';
import { TaskProjection } from '../../task/interfaces/task.projection';
import { TaskService } from '../../task/services/task.service';
import { UserService } from '../../users/user.service';
import { isNotEmpty } from '../../util/string.util';
import { TaskType } from '../../interface';

function formatRelativeDate(date: Date, prefix: string, today: number): string {
  let text = `${prefix} ${format(date, 'MMMM d')}`;

  if (date.getTime() < today) {
    text += ` (${formatDistance(today, date)} ago)`;
  } else if (date.getTime() === today) {
    text += ` (today)`;
  } else {
    text += ` (in ${formatDistance(date, today)})`;
  }

  return text;
}

interface TaskData {
  text: string;
  due: string;
  overdue: boolean;
}

export interface TaskGroup {
  key: string;
  text: string;
  type: TaskType;
  start: Date;
  due: Date;
  path: string | null;
}

function taskToData(task: TaskProjection | TaskGroup, today: number): TaskData {
  let text = task.text;

  if (task.text.match(/ from /)) {
    const parts = task.text.split(' from ');

    text = parts[0];
  } else if (task.text.match(/ in /)) {
    const parts = task.text.split(' in ');

    text = parts[0];
  }

  return {
    text,
    due: formatRelativeDate(task.due, 'Due', today),
    overdue: task.due.getTime() < today
  };
}

@Injectable()
export class MailService {
  constructor(
    private readonly logger: Logger,
    private mailerService: MailerService,
    @Inject(forwardRef(() => TaskService)) private taskService: TaskService,
    @Inject(forwardRef(() => ContainerService)) private containerService: ContainerService,
    @Inject(forwardRef(() => PlantInstanceService)) private plantInstanceService: PlantInstanceService,
    @Inject(forwardRef(() => UserService)) private userService: UserService,
    @Inject(forwardRef(() => GardenService)) private gardenService: GardenService
  ) {}

  async sendSummaryEmail() {
    try {
      const today = startOfDay(new Date()).getTime();

      const users = await this.userService.getUsers();
      for (const user of users) {
        if (!user.summaryEmail) {
          continue;
        }

        const gardens = await this.gardenService.getGardens(user._id);
        for (const garden of gardens) {
          const tasks = await this.taskService.findTasks(user._id, garden._id, [
            {
              $match: {
                completedOn: null,
                start: { $lt: endOfDay(new Date()) }
              }
            }
          ]);
          if (tasks.length === 0) {
            this.logger.log('No active tasks. Will not send summary email');
            return;
          }

          const containers = await this.containerService.getContainers(user._id, garden._id, [
            {
              $match: {
                archived: false
              }
            }
          ]);

          const containerTitleById = containers.reduce(
            (acc, container) => {
              if (container._id) {
                acc[container._id] = container.name;
              }
              return acc;
            },
            {} as Record<string, string>
          );

          const tasksWithoutContainer: TaskProjection[] = [];
          const tasksByContainer: Record<string, TaskProjection[]> = {};
          for (const task of tasks) {
            if (isNotEmpty(task.plantInstanceId) && task.plantInstanceId != 'null') {
              const plantInstance = await this.plantInstanceService.getPlantInstance(
                task.plantInstanceId,
                user._id,
                garden._id
              );
              if (plantInstance) {
                if (!(plantInstance.containerId in tasksByContainer)) {
                  tasksByContainer[plantInstance.containerId] = [];
                }

                tasksByContainer[plantInstance.containerId].push(task);
              } else {
                tasksWithoutContainer.push(task);
              }
            } else {
              tasksWithoutContainer.push(task);
            }
          }

          const tasksWithContainer = (Object.keys(tasksByContainer) as string[]).reduce(
            (acc, id) => {
              tasksByContainer[id].sort((a, b) => a.due.getTime() - b.due.getTime());

              acc.push({
                title: id in containerTitleById ? containerTitleById[id] : id,
                tasks: Object.values(
                  tasksByContainer[id].reduce<Record<string, TaskGroup>>((acc, task) => {
                    const key = `taskGroup-${task.path}_${task.type}_${task.text}_${task.start}_${task.due}_${task.completedOn}`;
                    if (!(key in acc)) {
                      acc[key] = {
                        key,
                        path: task.path,
                        type: task.type,
                        text: task.text,
                        start: task.start,
                        due: task.due
                      };
                    }

                    return acc;
                  }, {})
                ).map((task) => taskToData(task, today))
              });

              return acc;
            },
            [] as { title: string; tasks: TaskData[] }[]
          );

          tasksWithContainer.sort((a, b) => a.title.localeCompare(b.title));

          if (tasksWithoutContainer.length > 0) {
            tasksWithContainer.unshift({
              title: 'General Tasks',
              tasks: tasksWithoutContainer.map((task) => taskToData(task, today))
            });
          }

          await this.mailerService.sendMail({
            to: user.email,
            from: `"Garden Planner Team" <${process.env.FROM_EMAIL_ADDRESS}>`,
            subject: `🍅 Garden Planner - Weekly Summary - ${garden.name}`,
            template: './summary',
            context: {
              domain: process.env.DOMAIN,
              tasksWithContainer: tasksWithContainer
            }
          });
        }
      }
    } catch (e) {
      this.logger.error('Failed to send summary email', e);
      console.error(e);
    }
  }

  async sendTokenEmail(email: string, token: string) {
    await this.mailerService.sendMail({
      to: email,
      from: `"Garden Planner Team" <${process.env.FROM_EMAIL_ADDRESS}>`,
      subject: 'Verification Code For Garden Planner',
      template: './token',
      context: {
        domain: process.env.DOMAIN,
        token
      }
    });
  }
}
