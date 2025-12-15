import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { NotificationsService } from './notifications.service';
import { QueryNotificationsDto } from './dto/query-notifications.dto';
import { MarkAsReadDto } from './dto/mark-as-read.dto';

@Controller()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @MessagePattern({ cmd: 'get-notifications' })
  async getNotifications(
    @Payload() data: { userId: string; query: QueryNotificationsDto },
  ) {
    return this.notificationsService.findByUser(data.userId, data.query);
  }

  @MessagePattern({ cmd: 'count-unread' })
  async countUnread(@Payload() userId: string) {
    const count = await this.notificationsService.countUnread(userId);
    return { count };
  }

  @MessagePattern({ cmd: 'mark-as-read' })
  async markAsRead(@Payload() data: { userId: string; dto: MarkAsReadDto }) {
    return this.notificationsService.markAsRead(
      data.userId,
      data.dto.notificationIds,
    );
  }
}
