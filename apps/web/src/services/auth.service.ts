import api from "@/lib/api";
import type { AuthResponse } from "@/types";

export const authService = {
  register: async (data: {
    email: string;
    username: string;
    password: string;
  }): Promise<AuthResponse> => {
    const response = await api.post("/auth/register", data);
    return response.data;
  },

  login: async (data: {
    emailOrUsername: string;
    password: string;
  }): Promise<AuthResponse> => {
    const response = await api.post("/auth/login", data);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
  },
};
