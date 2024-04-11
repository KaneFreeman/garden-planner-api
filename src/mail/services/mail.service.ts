import { MailerService } from '@nestjs-modules/mailer';
import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { TaskService } from '../../task/task.service';
import { TaskDocument } from '../../task/interfaces/task.interface';
import { ContainerService } from '../../container/container.service';
import { isNotEmpty } from '../../util/string.util';
import { PlantInstanceService } from '../../plant-instance/plant-instance.service';
import { endOfDay, format, formatDistance, startOfDay } from 'date-fns';

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
  subtext: string;
  due: string;
  overdue: boolean;
}

function taskToData(task: TaskDocument, today: number): TaskData {
  let text = task.text;
  let subtext = '';

  if (task.text.match(/ from /)) {
    const parts = task.text.split(' from ');

    text = parts[0];
    subtext = `From ${parts[1]}`;
  } else if (task.text.match(/ in /)) {
    const parts = task.text.split(' in ');

    text = parts[0];
    subtext = `In ${parts[1]}`;
  }

  return {
    text,
    subtext,
    due: formatRelativeDate(task.due, 'Due', today),
    overdue: task.due.getTime() < today
  };
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private mailerService: MailerService,
    @Inject(forwardRef(() => TaskService)) private taskService: TaskService,
    @Inject(forwardRef(() => ContainerService)) private containerService: ContainerService,
    @Inject(forwardRef(() => PlantInstanceService)) private plantInstanceService: PlantInstanceService
  ) {}

  async sendSummaryEmail() {
    try {
      const today = startOfDay(new Date()).getTime();

      const containers = await this.containerService.getContainers({ archived: false });
      const tasks = await this.taskService.getTasks({ completedOn: null, start: { $lt: endOfDay(new Date()) } });

      const containerTitleById = containers.reduce((acc, container) => {
        if (container._id) {
          acc[container._id] = container.name;
        }
        return acc;
      }, {} as Record<string, string>);

      const tasksWithoutContainer: TaskDocument[] = [];
      const tasksByContainer: Record<string, TaskDocument[]> = {};
      for (const task of tasks) {
        if (isNotEmpty(task.plantInstanceId) && task.plantInstanceId != 'null') {
          const plantInstance = await this.plantInstanceService.getPlantInstance(task.plantInstanceId);
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

      const tasksWithContainer = (Object.keys(tasksByContainer) as string[]).reduce((acc, id) => {
        tasksByContainer[id].sort((a, b) => a.due.getTime() - b.due.getTime());

        acc.push({
          title: id in containerTitleById ? containerTitleById[id] : id,
          tasks: tasksByContainer[id].map((task) => taskToData(task, today))
        });

        return acc;
      }, [] as { title: string; tasks: TaskData[] }[]);

      tasksWithContainer.sort((a, b) => a.title.localeCompare(b.title));

      if (tasksWithoutContainer.length > 0) {
        tasksWithContainer.unshift({
          title: 'General Tasks',
          tasks: tasksWithoutContainer.map((task) => taskToData(task, today))
        });
      }

      await this.mailerService.sendMail({
        to: process.env.TO_EMAIL,
        from: `"Garden Planner Team" <${process.env.FROM_EMAIL_ADDRESS}>`,
        subject: '🍅 Garden Planner - Daily Summary',
        template: './summary',
        context: {
          domain: process.env.DOMAIN,
          tasksWithContainer: tasksWithContainer
        }
      });
    } catch (e) {
      this.logger.error('Failed to send summary email', e);
      console.error(e);
    }
  }
}
