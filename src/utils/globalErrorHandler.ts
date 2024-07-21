import {
  Catch,
  ExceptionFilter,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { prismaError } from 'prisma-better-errors';
import { Role } from 'src/common/enum';

interface User {
  role: Role;
  // Add other user properties if needed
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const capitalizeFirstLetter = (str) =>
      str.replace(/^\w/, (c) => c.toUpperCase());

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.message;

      if (status === HttpStatus.UNAUTHORIZED) {
        const user = request.user as User | undefined;

        if (user && user.role === Role.ADMIN) {
          message = 'Authorized for admin only';
        }
      } else if (
        status === HttpStatus.FORBIDDEN &&
        message.includes('Forbidden resource')
      ) {
        message = 'This action is forbidden for you';
      }
    } else if (this.isPrismaError(exception)) {
      const prismaErrorInstance = new prismaError(exception);

      if (
        prismaErrorInstance.metaData &&
        prismaErrorInstance.metaData['target']
      ) {
        const target = prismaErrorInstance.metaData['target'];
        if (target === null || target === '') {
          status = prismaErrorInstance.statusCode;
          message = prismaErrorInstance.message;
        } else {
          status = prismaErrorInstance.statusCode;
          message = capitalizeFirstLetter(`${target} already exists`);
        }
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
