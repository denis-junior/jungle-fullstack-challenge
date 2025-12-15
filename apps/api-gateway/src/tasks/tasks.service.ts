import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { QueryTasksDto } from './dto/query-tasks.dto';

@Injectable()
export class TasksService {
  constructor(@Inject('TASKS_SERVICE') private tasksClient: ClientProxy) {}

  async create(createTaskDto: CreateTaskDto, userId: string): Promise<unknown> {
    return firstValueFrom(
      this.tasksClient.send(
        { cmd: 'create-task' },
        { dto: createTaskDto, userId },
      ),
    );
  }

  async findAll(queryDto: QueryTasksDto): Promise<unknown> {
    return firstValueFrom(
      this.tasksClient.send({ cmd: 'find-all-tasks' }, queryDto),
    );
  }

  async findOne(id: string): Promise<unknown> {
    return firstValueFrom(this.tasksClient.send({ cmd: 'find-task' }, id));
  }

  async update(
    id: string,
    updateTaskDto: UpdateTaskDto,
    userId: string,
  ): Promise<unknown> {
    return firstValueFrom(
      this.tasksClient.send(
        { cmd: 'update-task' },
        { id, dto: updateTaskDto, userId },
      ),
    );
  }

  async remove(id: string, userId: string): Promise<unknown> {
    return firstValueFrom(
      this.tasksClient.send({ cmd: 'delete-task' }, { id, userId }),
    );
  }

  // COMENTÁRIOS

  async createComment(
    taskId: string,
    createCommentDto: CreateCommentDto,
    userId: string,
  ): Promise<unknown> {
    return firstValueFrom(
      this.tasksClient.send(
        { cmd: 'create-comment' },
        { taskId, dto: createCommentDto, userId },
      ),
    );
  }

  async findComments(
    taskId: string,
    page?: number,
    size?: number,
  ): Promise<unknown> {
    return firstValueFrom(
      this.tasksClient.send({ cmd: 'find-comments' }, { taskId, page, size }),
    );
  }
}
