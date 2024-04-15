import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { Logger, Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { ContainerModule } from '../container/container.module';
import { GardenModule } from '../garden/garden.module';
import { PlantInstanceModule } from '../plant-instance/plant-instance.module';
import { TaskModule } from '../task/task.module';
import { UserModule } from '../users/user.module';
import { MailTaskService } from './services/mail-task.service';
import { MailService } from './services/mail.service';

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
        dir: join(__dirname, env === 'production' ? './templates' : '../templates'),
        adapter: new HandlebarsAdapter(),
        options: {
          strict: true
        }
      }
    }),
    forwardRef(() => TaskModule),
    forwardRef(() => ContainerModule),
    forwardRef(() => PlantInstanceModule),
    forwardRef(() => UserModule),
    forwardRef(() => GardenModule)
  ],
  providers: [MailService, MailTaskService, Logger],
  exports: [MailService]
})
export class MailModule {}
