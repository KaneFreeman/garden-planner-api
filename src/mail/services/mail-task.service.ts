import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { MailService } from './mail.service';

const env = process.env.NODE_ENV || 'production';

@Injectable()
export class MailTaskService {
  constructor(
    private readonly logger: Logger,
    @Inject(forwardRef(() => MailService)) private mailService: MailService
  ) {}

  @Cron('0 * * * * *')
  async handleCron() {
    if (env !== 'production') {
      this.logger.log(`Not production (env: ${env}), skipping summary email...`);
      return;
    }

    this.logger.log('Sending summary email...');
    await this.mailService.sendSummaryEmail();
    this.logger.log('Summary email sent.');
  }
}
