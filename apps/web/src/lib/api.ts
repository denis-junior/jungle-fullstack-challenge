import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Interceptor para adicionar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Não tentar refresh em rotas de autenticação ou se já tentou ou se não tem refreshToken
    const isAuthRoute = originalRequest.url?.includes('/auth/login') || 
                       originalRequest.url?.includes('/auth/register');
    const refreshToken = localStorage.getItem("refreshToken");

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute && refreshToken) {
      originalRequest._retry = true;

      try {
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/refresh`,
          { refreshToken },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
          }
        );

        const { accessToken, refreshToken: newRefreshToken } = response.data;
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // console.log("Token expirado, redirecionando para login...");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        localStorage.removeItem("notifications");

        // Redirecionar para a página inicial
        window.location.href = "/";
        return Promise.reject(refreshError);
      }
    }

    // Extrair mensagem de erro do backend
    const errorMessage =
      error.response?.data?.message || error.message || "Erro desconhecido";
    const customError = new Error(errorMessage) as Error & {
      response?: string | { message?: string };
      status?: number;
    };
    customError.response = error.response;
    customError.status = error.response?.status;

    return Promise.reject(customError);
  }
);

export default api;
