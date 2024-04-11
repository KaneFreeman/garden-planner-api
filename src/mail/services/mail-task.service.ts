import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { MailService } from './mail.service';

@Injectable()
export class MailTaskService {
  private readonly logger = new Logger(MailTaskService.name);

  constructor(@Inject(forwardRef(() => MailService)) private mailService: MailService) {}

  @Cron('0 8 * * *')
  async handleCron() {
    this.logger.debug('Sending summary email...');
    await this.mailService.sendSummaryEmail();
    this.logger.debug('Summary email sent.');
  }
}
