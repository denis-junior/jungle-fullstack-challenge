import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';
import { QueryNotificationsDto } from './dto/query-notifications.dto';
import {
  ITaskCommentCreatedPayload,
  ITaskCreatedPayload,
  ITaskUpdatedPayload,
} from './interfaces';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {}

  // Criar notificação
  async create(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    metadata?: Record<string, unknown>,
  ) {
    const notification = this.notificationRepository.create({
      userId,
      type,
      title,
      message,
      metadata,
    });

    return this.notificationRepository.save(notification);
  }

  // Criar múltiplas notificações
  async createMany(
    userIds: string[],
    type: NotificationType,
    title: string,
    message: string,
    metadata?: Record<string, unknown>,
  ) {
    const notifications = userIds.map((userId) =>
      this.notificationRepository.create({
        userId,
        type,
        title,
        message,
        metadata,
      }),
    );

    return this.notificationRepository.save(notifications);
  }

  // Buscar notificações de um usuário
  async findByUser(userId: string, queryDto: QueryNotificationsDto) {
    const { page = 1, size = 10, read } = queryDto;
    const skip = (page - 1) * size;

    const where: Record<string, unknown> = { userId };
    if (read !== undefined) {
      where.read = read;
    }

    const [notifications, total] =
      await this.notificationRepository.findAndCount({
        where,
        skip,
        take: size,
        order: { createdAt: 'DESC' },
      });

    return {
      data: notifications,
      meta: {
        page,
        size,
        total,
        totalPages: Math.ceil(total / size),
        unreadCount: await this.countUnread(userId),
      },
    };
  }

  // Contar não lidas
  async countUnread(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: { userId, read: false },
    });
  }

  // Marcar como lida
  async markAsRead(userId: string, notificationIds?: string[]) {
    if (notificationIds && notificationIds.length > 0) {
      // Marcar específicas
      await this.notificationRepository.update(
        { id: In(notificationIds), userId },
        { read: true },
      );
    } else {
      // Marcar todas
      await this.notificationRepository.update({ userId }, { read: true });
    }

    return { message: 'Notificações marcadas como lidas' };
  }

  // PROCESSADORES DE EVENTOS

  async handleTaskCreated(event: ITaskCreatedPayload) {
    const { taskId, title, createdBy, assignedUserIds, createdAt } = event;

    if (!Array.isArray(assignedUserIds) || assignedUserIds.length === 0) {
      return;
    }

    // Notificar usuários atribuídos (exceto quem criou)
    const usersToNotify = assignedUserIds.filter(
      (userId) => userId !== createdBy,
    );

    if (usersToNotify.length === 0) {
      return;
    }

    await this.createMany(
      usersToNotify,
      NotificationType.TASK_ASSIGNED,
      'Nova tarefa atribuída',
      `Você foi atribuído à tarefa:  "${String(title)}"`,
      { taskId, createdBy, createdAt },
    );

    console.log(`Notificações criadas para tarefa:  ${String(title)}`);
  }

  async handleTaskUpdated(event: ITaskUpdatedPayload) {
    const {
      taskId,
      title,
      updatedBy,
      statusChanged,
      oldStatus,
      newStatus,
      assignedUserIds,
      updatedAt,
    } = event;

    if (
      !statusChanged ||
      !Array.isArray(assignedUserIds) ||
      assignedUserIds.length === 0
    ) {
      return;
    }

    // Notificar usuários atribuídos (exceto quem atualizou)
    const usersToNotify = assignedUserIds.filter(
      (userId) => userId !== updatedBy,
    );

    if (usersToNotify.length === 0) {
      return;
    }

    await this.createMany(
      usersToNotify,
      NotificationType.STATUS_CHANGED,
      'Status da tarefa alterado',
      `A tarefa "${String(title)}" mudou de ${String(oldStatus)} para ${String(newStatus)}`,
      { taskId, updatedBy, oldStatus, newStatus, updatedAt },
    );

    console.log(`Notificações de status para:  ${String(title)}`);
  }

  async handleCommentCreated(event: ITaskCommentCreatedPayload) {
    const {
      commentId,
      taskId,
      taskTitle,
      content,
      userId,
      assignedUserIds,
      createdAt,
    } = event;

    if (!Array.isArray(assignedUserIds) || assignedUserIds.length === 0) {
      return;
    }

    // Notificar participantes (exceto quem comentou)
    const usersToNotify = assignedUserIds.filter(
      (assignedUserId) => assignedUserId !== userId,
    );

    if (usersToNotify.length === 0) {
      return;
    }

    await this.createMany(
      usersToNotify,
      NotificationType.COMMENT_CREATED,
      'Novo comentário',
      `Novo comentário na tarefa "${String(taskTitle)}":  ${String(content).substring(0, 100)}${String(content).length > 100 ? '...' : ''}`,
      { commentId, taskId, userId, createdAt },
    );

    console.log(`Notificações de comentário para:  ${String(taskTitle)}`);
  }
}
