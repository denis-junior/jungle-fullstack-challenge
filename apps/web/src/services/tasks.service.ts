import api from "@/lib/api";
import type { Task, PaginatedResponse, Comment } from "@/types";

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

  createTask: async (data: any): Promise<Task> => {
    const response = await api.post("/tasks", data);
    return response.data;
  },

  updateTask: async (id: string, data: any): Promise<Task> => {
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
