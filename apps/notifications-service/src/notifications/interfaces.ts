export interface ITaskCreatedPayload {
  taskId: string;
  title: string;
  description: string;
  deadline: string;
  priority: string;
  status: string;
  createdBy: string;
  comments: string[];
  assignedUserIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ITaskUpdatedPayload {
  taskId: string;
  title: string;
  updatedBy: string;
  oldStatus: string;
  newStatus: string;
  statusChanged: boolean;
  assignedUserIds: string[];
  updatedAt: Date;
}

export interface ITaskCommentCreatedPayload {
  commentId: string;
  taskId: string;
  taskTitle: string;
  content: string;
  userId: string;
  assignedUserIds: string[];
  createdBy: string;
  createdAt: string;
}

export interface IStatusChangedPayload {
  message: string;
  taskId: string;
  commentId?: string;
  newStatus?: string;
}
