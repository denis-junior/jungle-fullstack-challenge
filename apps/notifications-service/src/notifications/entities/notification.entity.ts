import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum NotificationType {
  TASK_CREATED = 'TASK_CREATED',
  TASK_UPDATED = 'TASK_UPDATED',
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  COMMENT_CREATED = 'COMMENT_CREATED',
  STATUS_CHANGED = 'STATUS_CHANGED',
}

export interface NotificationMetadata {
  taskId?: string;
  taskTitle?: string;
  commentId?: string;
  oldStatus?: string;
  newStatus?: string;
}

@Entity('notifications')
@Index(['userId', 'read']) // Índice para consultas rápidas
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index() // Índice para buscar por usuário
  userId: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column()
  title: string;

  @Column('text')
  message: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: NotificationMetadata;

  @Column({ default: false })
  read: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
