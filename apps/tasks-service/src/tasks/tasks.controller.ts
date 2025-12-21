import { Controller } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { QueryTasksDto } from './dto/query-tasks.dto';

@Controller()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  private handleRpcError(error: unknown) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'status' in error &&
      'response' in error
    ) {
      const statusCode = (error as { status: number }).status;
      const response = (error as { response: unknown }).response;
      const message =
        typeof response === 'string'
          ? response
          : (typeof response === 'object' &&
            response !== null &&
            'message' in response
              ? (response as { message: string }).message
              : null) || (error as unknown as Error).message;

      throw new RpcException({
        statusCode,
        message,
        error: (error as unknown as Error).name,
      });
    }
    throw new RpcException(error as string | object);
  }

  @MessagePattern({ cmd: 'create-task' })
  async create(@Payload() data: { dto: CreateTaskDto; userId: string }) {
    try {
      return await this.tasksService.create(data.dto, data.userId);
    } catch (error) {
      this.handleRpcError(error);
    }
  }

  @MessagePattern({ cmd: 'find-all-tasks' })
  async findAll(@Payload() queryDto: QueryTasksDto) {
    try {
      return await this.tasksService.findAll(queryDto);
    } catch (error) {
      this.handleRpcError(error);
    }
  }

  @MessagePattern({ cmd: 'find-task' })
  async findOne(@Payload() id: string) {
    try {
      return await this.tasksService.findOne(id);
    } catch (error) {
      this.handleRpcError(error);
    }
  }

  @MessagePattern({ cmd: 'update-task' })
  async update(
    @Payload() data: { id: string; dto: UpdateTaskDto; userId: string },
  ) {
    try {
      return await this.tasksService.update(data.id, data.dto, data.userId);
    } catch (error) {
      this.handleRpcError(error);
    }
  }

  @MessagePattern({ cmd: 'delete-task' })
  async remove(@Payload() data: { id: string; userId: string }) {
    try {
      return await this.tasksService.remove(data.id, data.userId);
    } catch (error) {
      this.handleRpcError(error);
    }
  }

  // COMENTÁRIOS

  @MessagePattern({ cmd: 'create-comment' })
  async createComment(
    @Payload() data: { taskId: string; dto: CreateCommentDto; userId: string },
  ) {
    try {
      return await this.tasksService.createComment(
        data.taskId,
        data.dto,
        data.userId,
      );
    } catch (error) {
      this.handleRpcError(error);
    }
  }

  @MessagePattern({ cmd: 'find-comments' })
  async findComments(
    @Payload() data: { taskId: string; page?: number; size?: number },
  ) {
    try {
      return await this.tasksService.findComments(
        data.taskId,
        data.page,
        data.size,
      );
    } catch (error) {
      this.handleRpcError(error);
    }
  }

  // HISTÓRICO

  @MessagePattern({ cmd: 'find-task-history' })
  async getTaskHistory(
    @Payload() data: { taskId: string; page?: number; size?: number },
  ) {
    try {
      return await this.tasksService.getTaskHistory(
        data.taskId,
        data.page,
        data.size,
      );
    } catch (error) {
      this.handleRpcError(error);
    }
  }
}
