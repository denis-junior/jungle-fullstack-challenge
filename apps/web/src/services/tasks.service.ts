import api from "@/lib/api";
import {
  type Task,
  type PaginatedResponse,
  type Comment,
  TaskStatus,
  TaskPriority,
} from "@/types";

export const tasksService = {
  getTasks: async (params?: {
    page?: number;
    size?: number;
    status?: string;
    priority?: string;
    search?: string;
  }): Promise<PaginatedResponse<Task>> => {
    const response = await api.get("/tasks", { params });
    return response.data;
  },

  getTask: async (id: string): Promise<Task> => {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  },

  createTask: async (data: {
    assignedUserIds: string[] | undefined;
    title: string;
    description: string;
    priority: TaskPriority;
    status: TaskStatus;
    deadline?: string | undefined;
  }): Promise<Task> => {
    const response = await api.post("/tasks", data);
    return response.data;
  },

  updateTask: async (
    id: string,
    data: {
      title?: string;
      description?: string;
      priority?: TaskPriority;
      status?: TaskStatus;
      deadline?: string;
      assignedUserIds?: string[];
    }
  ): Promise<Task> => {
    const response = await api.put(`/tasks/${id}`, data);
    return response.data;
  },

  deleteTask: async (id: string): Promise<void> => {
    await api.delete(`/tasks/${id}`);
  },

  getComments: async (
    taskId: string,
    params?: { page?: number; size?: number }
  ): Promise<PaginatedResponse<Comment>> => {
    const response = await api.get(`/tasks/${taskId}/comments`, { params });
    return response.data;
  },

  createComment: async (taskId: string, content: string): Promise<Comment> => {
    const response = await api.post(`/tasks/${taskId}/comments`, { content });
    return response.data;
  },
};
