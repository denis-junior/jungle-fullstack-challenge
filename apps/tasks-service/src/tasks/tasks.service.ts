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
import { TaskHistory, HistoryAction } from './entities/task-history.entity';
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
    @InjectRepository(TaskHistory)
    private historyRepository: Repository<TaskHistory>,
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

    // Registrar no histórico
    await this.createHistory(
      savedTask.id,
      userId,
      HistoryAction.CREATED,
      { task: taskData },
      `Tarefa "${savedTask.title}" criada`,
    );

    // Atribuir usuários
    if (assignedUserIds && assignedUserIds.length > 0) {
      const assignments = assignedUserIds.map((assignedUserId) =>
        this.assignmentRepository.create({
          taskId: savedTask.id,
          userId: assignedUserId,
        }),
      );
      await this.assignmentRepository.save(assignments);

      // Registrar atribuições no histórico
      await this.createHistory(
        savedTask.id,
        userId,
        HistoryAction.ASSIGNED,
        { assignedUserIds },
        `${assignedUserIds.length} usuário(s) atribuído(s) à tarefa`,
      );
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
    const oldValues = { ...task };

    const { assignedUserIds, ...taskData } = updateTaskDto;

    // Atualizar tarefa
    Object.assign(task, taskData);
    const updatedTask = await this.taskRepository.save(task);

    // Registrar no histórico
    const changes = this.getChanges(oldValues, taskData);
    if (Object.keys(changes).length > 0) {
      await this.createHistory(
        updatedTask.id,
        userId,
        HistoryAction.UPDATED,
        changes,
        'Tarefa atualizada',
      );
    }

    // Registrar mudança de status
    if (oldStatus !== updatedTask.status) {
      await this.createHistory(
        updatedTask.id,
        userId,
        HistoryAction.STATUS_CHANGED,
        { oldStatus, newStatus: updatedTask.status },
        `Status alterado de ${oldStatus} para ${updatedTask.status}`,
      );
    }

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

        await this.createHistory(
          updatedTask.id,
          userId,
          HistoryAction.ASSIGNED,
          { assignedUserIds },
          `Atribuições atualizadas`,
        );
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

    // Deletar comentários relacionados
    await this.commentRepository.delete({ taskId: id });

    // Deletar atribuições relacionadas
    await this.assignmentRepository.delete({ taskId: id });

    // Deletar a tarefa
    await this.taskRepository.delete(id);

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

    // Registrar no histórico
    await this.createHistory(
      taskId,
      userId,
      HistoryAction.COMMENTED,
      { commentId: savedComment.id, content: createCommentDto.content },
      'Novo comentário adicionado',
    );

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
        console.error('Erro ao buscar usuários:', error);
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

  // HISTÓRICO (AUDIT LOG)

  private async createHistory(
    taskId: string,
    userId: string,
    action: HistoryAction,
    changes: Record<string, any>,
    description: string,
  ) {
    const history = this.historyRepository.create({
      taskId,
      userId,
      action,
      changes,
      description,
    });

    return this.historyRepository.save(history);
  }

  async getTaskHistory(taskId: string, page: number = 1, size: number = 20) {
    await this.findOne(taskId); // Verificar se tarefa existe

    const skip = (page - 1) * size;

    const [history, total] = await this.historyRepository.findAndCount({
      where: { taskId },
      skip,
      take: size,
      order: { createdAt: 'DESC' },
    });

    // Buscar dados dos usuários
    const userIds: string[] = [...new Set(history.map((h) => h.userId))];
    let usersMap = new Map();

    if (userIds.length > 0) {
      try {
        const users = await firstValueFrom<User[]>(
          this.authService.send({ cmd: 'find-users-by-ids' }, { userIds }),
        );
        usersMap = new Map(users.map((u) => [u.id, u]));
      } catch (error) {
        console.error('Erro ao buscar usuários:', error);
      }
    }

    // Adicionar dados do usuário ao histórico
    const historyWithUsers = history.map((h) => ({
      ...h,
      user: (usersMap.get(h.userId) || {
        id: h.userId,
        username: 'Usuário desconhecido',
      }) as User,
    }));

    return {
      data: historyWithUsers,
      meta: {
        page,
        size,
        total,
        totalPages: Math.ceil(total / size),
      },
    };
  }

  private getChanges(
    oldValues: any,
    newValues: any,
  ): Record<string, { old: any; new: any }> {
    const changes: Record<string, { old: any; new: any }> = {};

    for (const key in newValues) {
      if (newValues[key] !== undefined && oldValues[key] !== newValues[key]) {
        changes[key] = {
          old: oldValues[key],
          new: newValues[key],
        };
      }
    }

    return changes;
  }
}
