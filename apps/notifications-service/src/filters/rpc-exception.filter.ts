import {
  ExceptionFilter,
  Catch,
  HttpException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { throwError } from 'rxjs';
import { Logger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

@Catch()
@Injectable()
export class RpcExceptionFilter implements ExceptionFilter {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  catch(exception: unknown) {
    this.logger.error('RPC Exception caught', {
      context: 'RpcExceptionFilter',
      exception,
    });

    if (exception instanceof RpcException) {
      return throwError(() => exception.getError());
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();
      const message =
        typeof response === 'string'
          ? response
          : typeof response === 'object' &&
              response !== null &&
              'message' in response
            ? String(response.message)
            : 'Unknown error';

      this.logger.error('HttpException in RPC', {
        context: 'RpcExceptionFilter',
        status,
        message,
      });

      return throwError(() => ({
        statusCode: status,
        message,
        error: exception.name,
      }));
    }

    if (exception instanceof Error) {
      this.logger.error('Error in RPC', {
        context: 'RpcExceptionFilter',
        message: exception.message,
        stack: exception.stack,
      });
      return throwError(() => ({
        statusCode: 500,
        message: exception.message,
        error: 'Internal Server Error',
      }));
    }

    return throwError(() => ({
      statusCode: 500,
      message: 'Unknown error occurred',
      error: 'Internal Server Error',
    }));
  }
}
