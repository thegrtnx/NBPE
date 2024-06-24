import {
  Catch,
  ExceptionFilter,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { prismaError } from 'prisma-better-errors';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.message;
    } else if (this.isPrismaError(exception)) {
      const prismaErrorInstance = new prismaError(exception);

      if (
        prismaErrorInstance.metaData &&
        prismaErrorInstance.metaData['target']
      ) {
        if (
          prismaErrorInstance.metaData['target'] === null ||
          prismaErrorInstance.metaData['target'] === ''
        ) {
          status = prismaErrorInstance.statusCode;
          message = prismaErrorInstance.message;
        } else {
          status = prismaErrorInstance.statusCode;
          message =
            prismaErrorInstance.message +
            ' on ' +
            prismaErrorInstance.metaData['target'];
        }
        // } else if (prismaErrorInstance.message === 'P2025') {
        //   status = HttpStatus.NOT_FOUND;
        //   message = 'The requested resource was not found.';
      } else {
        status = prismaErrorInstance.statusCode;
        message = prismaErrorInstance.message;
      }
    } else {
      this.logger.error(exception);
      message = exception.message;
      status = HttpStatus.INTERNAL_SERVER_ERROR;
    }

    response.status(status).json({
      statusCode: status,
      statusType: HttpStatus[status],
      message: message,
    });
  }

  private isPrismaError(error: any): boolean {
    return error.code !== undefined;
  }
}
