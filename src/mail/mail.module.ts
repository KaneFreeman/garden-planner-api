import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { TaskModule } from '../task/task.module';
import { MailTaskService } from './services/mail-task.service';
import { MailService } from './services/mail.service';
import { ContainerModule } from '../container/container.module';
import { PlantInstanceModule } from '../plant-instance/plant-instance.module';

const env = process.env.NODE_ENV || 'production';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [env === 'production' ? '.env.production' : '.env.development']
    }),
    MailerModule.forRoot({
      transport: {
        host: process.env.FROM_EMAIL_HOST,
        secure: true,
        auth: {
          user: process.env.FROM_EMAIL_ADDRESS,
          pass: process.env.FROM_EMAIL_PASSWORD
        }
      },
      defaults: {
        from: `"No Reply" ${process.env.FROM_EMAIL_ADDRESS}`
      },
      template: {
        dir: join(__dirname, 'templates'),
        adapter: new HandlebarsAdapter(),
        options: {
          strict: true
        }
      }
    }),
    forwardRef(() => TaskModule),
    forwardRef(() => ContainerModule),
    forwardRef(() => PlantInstanceModule)
  ],
  providers: [MailService, MailTaskService],
  exports: [MailService]
})
export class MailModule {}
