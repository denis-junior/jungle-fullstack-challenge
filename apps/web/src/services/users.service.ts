import api from "@/lib/api";
import type { User } from "@/types";

class UsersService {
  async getAll(): Promise<User[]> {
    const response = await api.get("/auth/users");
    return response.data;
  }
}

export const usersService = new UsersService();
