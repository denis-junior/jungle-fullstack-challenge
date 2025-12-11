import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { QueryTasksDto } from './dto/query-tasks.dto';

@Controller()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @MessagePattern({ cmd: 'create-task' })
  async create(@Payload() data: { dto: CreateTaskDto; userId: string }) {
    return this.tasksService.create(data.dto, data.userId);
  }

  @MessagePattern({ cmd: 'find-all-tasks' })
  async findAll(@Payload() queryDto: QueryTasksDto) {
    return this.tasksService.findAll(queryDto);
  }

  @MessagePattern({ cmd: 'find-task' })
  async findOne(@Payload() id: string) {
    return this.tasksService.findOne(id);
  }

  @MessagePattern({ cmd: 'update-task' })
  async update(
    @Payload() data: { id: string; dto: UpdateTaskDto; userId: string },
  ) {
    return this.tasksService.update(data.id, data.dto, data.userId);
  }

  @MessagePattern({ cmd: 'delete-task' })
  async remove(@Payload() data: { id: string; userId: string }) {
    return this.tasksService.remove(data.id, data.userId);
  }

  // COMENTÁRIOS

  @MessagePattern({ cmd: 'create-comment' })
  async createComment(
    @Payload() data: { taskId: string; dto: CreateCommentDto; userId: string },
  ) {
    return this.tasksService.createComment(data.taskId, data.dto, data.userId);
  }

  @MessagePattern({ cmd: 'find-comments' })
  async findComments(
    @Payload() data: { taskId: string; page?: number; size?: number },
  ) {
    return this.tasksService.findComments(data.taskId, data.page, data.size);
  }
}
