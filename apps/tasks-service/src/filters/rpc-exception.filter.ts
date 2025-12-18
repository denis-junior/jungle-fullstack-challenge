import { ExceptionFilter, Catch, Logger, HttpException } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { throwError } from 'rxjs';

@Catch()
export class RpcExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(RpcExceptionFilter.name);

  catch(exception: unknown) {
    this.logger.error('RPC Exception caught:', exception);

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

      this.logger.error(
        `HttpException: ${status} - ${JSON.stringify(message)}`,
      );

      return throwError(() => ({
        statusCode: status,
        message,
        error: exception.name,
      }));
    }

    if (exception instanceof Error) {
      this.logger.error(exception.message, exception.stack);
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
