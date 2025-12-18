import { Injectable, Inject, HttpException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, catchError } from 'rxjs';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { QueryTasksDto } from './dto/query-tasks.dto';

@Injectable()
export class TasksService {
  constructor(@Inject('TASKS_SERVICE') private tasksClient: ClientProxy) {}

  private handleRpcError(error: unknown): never {
    // Verificar se tem statusCode como número
    if (
      typeof error === 'object' &&
      error !== null &&
      'statusCode' in error &&
      typeof error.statusCode === 'number' &&
      'message' in error &&
      typeof error.message === 'string'
    ) {
      throw new HttpException(error.message, error.statusCode);
    }

    // Verificar se tem status como número
    if (
      typeof error === 'object' &&
      error !== null &&
      'status' in error &&
      typeof error.status === 'number' &&
      'message' in error &&
      typeof error.message === 'string'
    ) {
      throw new HttpException(error.message, error.status);
    }

    // Fallback para erro genérico
    const message =
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof error.message === 'string'
        ? error.message
        : 'Internal server error';
    throw new HttpException(message, 500);
  }

  async create(createTaskDto: CreateTaskDto, userId: string): Promise<unknown> {
    return firstValueFrom(
      this.tasksClient
        .send({ cmd: 'create-task' }, { dto: createTaskDto, userId })
        .pipe(
          catchError((error) => {
            this.handleRpcError(error);
          }),
        ),
    );
  }

  async findAll(queryDto: QueryTasksDto): Promise<unknown> {
    return firstValueFrom(
      this.tasksClient.send({ cmd: 'find-all-tasks' }, queryDto).pipe(
        catchError((error) => {
          this.handleRpcError(error);
        }),
      ),
    );
  }

  async findOne(id: string): Promise<unknown> {
    return firstValueFrom(
      this.tasksClient.send({ cmd: 'find-task' }, id).pipe(
        catchError((error) => {
          this.handleRpcError(error);
        }),
      ),
    );
  }

  async update(
    id: string,
    updateTaskDto: UpdateTaskDto,
    userId: string,
  ): Promise<unknown> {
    return firstValueFrom(
      this.tasksClient
        .send({ cmd: 'update-task' }, { id, dto: updateTaskDto, userId })
        .pipe(
          catchError((error) => {
            this.handleRpcError(error);
          }),
        ),
    );
  }

  async remove(id: string, userId: string): Promise<unknown> {
    return firstValueFrom(
      this.tasksClient.send({ cmd: 'delete-task' }, { id, userId }).pipe(
        catchError((error) => {
          this.handleRpcError(error);
        }),
      ),
    );
  }

  // COMENTÁRIOS

  async createComment(
    taskId: string,
    createCommentDto: CreateCommentDto,
    userId: string,
  ): Promise<unknown> {
    return firstValueFrom(
      this.tasksClient
        .send(
          { cmd: 'create-comment' },
          { taskId, dto: createCommentDto, userId },
        )
        .pipe(
          catchError((error) => {
            this.handleRpcError(error);
          }),
        ),
    );
  }

  async findComments(
    taskId: string,
    page?: number,
    size?: number,
  ): Promise<unknown> {
    return firstValueFrom(
      this.tasksClient
        .send({ cmd: 'find-comments' }, { taskId, page, size })
        .pipe(
          catchError((error) => {
            this.handleRpcError(error);
          }),
        ),
    );
  }
}
