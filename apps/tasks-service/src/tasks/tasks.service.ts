import {
  Injectable,
  NotFoundException,
  Inject,
  ForbiddenException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { Task } from './entities/task.entity';
import { Comment } from './entities/comment.entity';
import { TaskAssignment } from './entities/task-assignment.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { QueryTasksDto } from './dto/query-tasks.dto';
import { User } from 'src/interfaces';

@Injectable()
export class TasksService implements OnModuleInit {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
    @InjectRepository(TaskAssignment)
    private assignmentRepository: Repository<TaskAssignment>,
    @Inject('RABBITMQ_CLIENT')
    private rabbitClient: ClientProxy,
    @Inject('AUTH_SERVICE')
    private authService: ClientProxy,
  ) {}

  async onModuleInit() {
    await this.rabbitClient.connect();
    await this.authService.connect();
  }

  async create(createTaskDto: CreateTaskDto, userId: string) {
    const { assignedUserIds, ...taskData } = createTaskDto;

    // Criar tarefa
    const task = this.taskRepository.create({
      ...taskData,
      createdBy: userId,
    });

    const savedTask = await this.taskRepository.save(task);

    // Atribuir usuários
    if (assignedUserIds && assignedUserIds.length > 0) {
      const assignments = assignedUserIds.map((assignedUserId) =>
        this.assignmentRepository.create({
          taskId: savedTask.id,
          userId: assignedUserId,
        }),
      );
      await this.assignmentRepository.save(assignments);
    }

    // Publicar evento
    this.rabbitClient.emit('task.created', {
      taskId: savedTask.id,
      title: savedTask.title,
      createdBy: userId,
      assignedUserIds: assignedUserIds || [],
      createdAt: savedTask.createdAt,
    });

    return this.findOne(savedTask.id);
  }

  async findAll(queryDto: QueryTasksDto) {
    const { page, size, status, priority, search } = queryDto;
    const skip = (page - 1) * size;

    const where: FindOptionsWhere<Task> = {};

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (search) {
      where.title = Like(`%${search}%`);
    }

    const [tasks, total] = await this.taskRepository.findAndCount({
      where,
      relations: ['assignments', 'comments'],
      skip,
      take: size,
      order: { createdAt: 'DESC' },
    });

    return {
      data: tasks,
      meta: {
        page,
        size,
        total,
        totalPages: Math.ceil(total / size),
      },
    };
  }

  async findOne(id: string) {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['assignments', 'comments'],
    });

    if (!task) {
      throw new NotFoundException(`Task com ID ${id} não encontrada`);
    }

    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto, userId: string) {
    const task = await this.findOne(id);
    const oldStatus = task.status;

    const { assignedUserIds, ...taskData } = updateTaskDto;

    // Atualizar tarefa
    Object.assign(task, taskData);
    const updatedTask = await this.taskRepository.save(task);

    // Atualizar atribuições se fornecidas
    if (assignedUserIds) {
      await this.assignmentRepository.delete({ taskId: id });
      if (assignedUserIds.length > 0) {
        const assignments = assignedUserIds.map((assignedUserId) =>
          this.assignmentRepository.create({
            taskId: id,
            userId: assignedUserId,
          }),
        );
        await this.assignmentRepository.save(assignments);
      }
    }

    // Publicar evento
    this.rabbitClient.emit('task.updated', {
      taskId: updatedTask.id,
      title: updatedTask.title,
      updatedBy: userId,
      oldStatus,
      newStatus: updatedTask.status,
      statusChanged: oldStatus !== updatedTask.status,
      assignedUserIds: assignedUserIds || task.assignments.map((a) => a.userId),
      updatedAt: updatedTask.updatedAt,
    });

    return this.findOne(id);
  }

  async remove(id: string, userId: string) {
    const task = await this.findOne(id);

    if (task.createdBy !== userId) {
      throw new ForbiddenException(
        'Você não tem permissão para deletar esta tarefa',
      );
    }

    await this.taskRepository.remove(task);
    return { message: 'Tarefa deletada com sucesso' };
  }

  // COMENTÁRIOS

  async createComment(
    taskId: string,
    createCommentDto: CreateCommentDto,
    userId: string,
  ) {
    const task = await this.findOne(taskId);

    const comment = this.commentRepository.create({
      content: createCommentDto.content,
      userId,
      taskId,
    });

    const savedComment = await this.commentRepository.save(comment);

    // Publicar evento
    this.rabbitClient.emit('task.comment.created', {
      commentId: savedComment.id,
      taskId,
      taskTitle: task.title,
      content: savedComment.content,
      userId,
      createdAt: savedComment.createdAt,
      assignedUserIds: task.assignments.map((a) => a.userId),
      createdBy: task.createdBy,
    });

    return savedComment;
  }

  async findComments(taskId: string, page: number = 1, size: number = 10) {
    await this.findOne(taskId); // Verificar se tarefa existe

    const skip = (page - 1) * size;

    const [comments, total] = await this.commentRepository.findAndCount({
      where: { taskId },
      skip,
      take: size,
      order: { createdAt: 'DESC' },
    });

    // Buscar dados dos usuários
    const userIds: string[] = [...new Set(comments.map((c) => c.userId))];
    let usersMap = new Map();

    if (userIds.length > 0) {
      try {
        const users = await firstValueFrom<User[]>(
          this.authService.send({ cmd: 'find-users-by-ids' }, { userIds }),
        );
        usersMap = new Map(users.map((u) => [u.id, u]));
      } catch (error) {
        console.error('❌ Erro ao buscar usuários:', error);
      }
    }

    // Adicionar dados do usuário aos comentários
    const commentsWithUsers = comments.map((comment) => ({
      ...comment,
      user: (usersMap.get(comment.userId) || {
        id: comment.userId,
        username: 'Usuário desconhecido',
      }) as User,
    }));

    return {
      data: commentsWithUsers,
      meta: {
        page,
        size,
        total,
        totalPages: Math.ceil(total / size),
      },
    };
  }
}
