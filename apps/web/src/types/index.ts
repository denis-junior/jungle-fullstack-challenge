export enum TaskStatus {
  TODO = "TODO",
  IN_PROGRESS = "IN_PROGRESS",
  REVIEW = "REVIEW",
  DONE = "DONE",
}

export enum TaskPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

export interface User {
  id: string;
  email: string;
  username: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface IAuthLogin {
  emailOrUsername: string;
  password: string;
}
export interface IAuthRegister {
  email: string;
  username: string;
  password: string;
}

export interface ITaskSubmit {
  title: string;
  description: string;
  deadline: string;
  priority: string;
  status: string;
  assignedUserIds: string[];
}
export interface Task {
  id: string;
  title: string;
  description: string;
  deadline?: string;
  priority: TaskPriority;
  status: TaskStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  assignments: TaskAssignment[];
  comments: Comment[];
}

export interface TaskAssignment {
  id: string;
  taskId: string;
  userId: string;
  assignedAt: string;
}

export interface Comment {
  id: string;
  content: string;
  userId: string;
  taskId: string;
  createdAt: string;
  user: User;
}
export interface NotificationMetadata {
  taskId?: string;
  taskTitle?: string;
  commentId?: string;
  oldStatus?: string;
  newStatus?: string;
}
export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  metadata?: NotificationMetadata;
  read: boolean;
  createdAt: string;
}

export interface INotificationsLocalStorage {
  type: string;
  title: string;
  message: string;
  taskId: string;
  id: string;
  read: boolean;
  createdAt: Date;
}

export interface INotificationWebSocket {
  title: string;
  message: string;
  taskId: string;
  assignedUserIds?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    size: number;
    total: number;
    totalPages: number;
  };
}
