import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';
import * as types from './interfaces';

@Controller()
export class NotificationsConsumer {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  @EventPattern('task.created')
  async handleTaskCreated(@Payload() data: types.ITaskCreatedPayload) {
    console.log('Evento recebido:  task.created', data);

    await this.notificationsService.handleTaskCreated(data);

    // Emitir via WebSocket
    if (data.assignedUserIds && data.assignedUserIds.length > 0) {
      data.assignedUserIds.forEach((userId) => {
        if (userId !== data.createdBy) {
          this.notificationsGateway.sendToUser(userId, 'task:created', {
            message: `Nova tarefa atribuída: "${data.title}"`,
            taskId: data.taskId,
          });
        }
      });
    }
  }

  @EventPattern('task.updated')
  async handleTaskUpdated(@Payload() data: types.ITaskUpdatedPayload) {
    console.log('Evento recebido: task.updated', data);

    await this.notificationsService.handleTaskUpdated(data);

    // Emitir via WebSocket se status mudou
    if (
      data.statusChanged &&
      data.assignedUserIds &&
      data.assignedUserIds.length > 0
    ) {
      data.assignedUserIds.forEach((userId) => {
        if (userId !== data.updatedBy) {
          this.notificationsGateway.sendToUser(userId, 'task:updated', {
            message: `Status da tarefa "${data.title}" mudou para ${data.newStatus}`,
            taskId: data.taskId,
            newStatus: data.newStatus,
          });
        }
      });
    }
  }

  @EventPattern('task.comment.created')
  async handleCommentCreated(
    @Payload() data: types.ITaskCommentCreatedPayload,
  ) {
    console.log('Evento recebido: task.comment.created', data);

    await this.notificationsService.handleCommentCreated(data);

    const usersToNotify = new Set<string>(data.assignedUserIds);
    usersToNotify.add(data.createdBy);

    usersToNotify.forEach((userId) => {
      if (userId !== data.userId) {
        this.notificationsGateway.sendToUser(userId, 'comment:new', {
          message: `Novo comentário na tarefa "${data.taskTitle}"`,
          taskId: data.taskId,
          commentId: data.commentId,
        });
      }
    });
  }
}
