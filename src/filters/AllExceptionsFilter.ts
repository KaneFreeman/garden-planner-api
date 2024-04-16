import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: Logger, private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    if (exception instanceof Error) {
      this.logger.error(exception['stack']);
    }

    let httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
    let response: string | undefined = undefined;

    if (exception instanceof HttpException) {
      httpStatus = exception.getStatus();
      response = exception['response'];
    }

    httpAdapter.reply(ctx.getResponse(), response, httpStatus);
  }
}
