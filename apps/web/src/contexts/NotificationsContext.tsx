import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { toast } from "sonner";
import type { INotificationsLocalStorage, INotificationWebSocket } from "@/types";

export interface Notification {
  id: string;
  type: "task_assigned" | "task_updated" | "task_deleted" | "comment_added";
  title: string;
  message: string;
  taskId?: string;
  read: boolean;
  createdAt: Date;
}

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (
    notification: Omit<Notification, "id" | "read" | "createdAt">
  ) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

const NotificationsContext = createContext<
  NotificationsContextType | undefined
>(undefined);

const NOTIFICATIONS_STORAGE_KEY = "notifications";

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    // Carregar notificações do localStorage na inicialização
    try {
      const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        console.log("Notificações carregadas do localStorage:", parsed);
        // Converter createdAt de string para Date
        return parsed.map((n: INotificationsLocalStorage) => ({
          ...n,
          createdAt: new Date(n.createdAt),
        }));
      }
    } catch (error) {
      console.error("Erro ao carregar notificações do localStorage:", error);
    }
    return [];
  });
  const [socket, setSocket] = useState<Socket | null>(null);

  // Salvar notificações no localStorage sempre que mudarem
  useEffect(() => {
    try {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
    } catch (error) {
      console.error("Erro ao salvar notificações no localStorage:", error);
    }
  }, [notifications]);

  const addNotification = useCallback(
    (notification: Omit<Notification, "id" | "read" | "createdAt">) => {
      const newNotification: Notification = {
        ...notification,
        id: Date.now().toString(),
        read: false,
        createdAt: new Date(),
      };
      setNotifications((prev) => [newNotification, ...prev]);
    },
    []
  );

  // Conectar ao WebSocket
  useEffect(() => {
    if (!user?.id) return;

    const token = localStorage.getItem("accessToken");
    if (!token) return;

    console.log("🔌 Conectando ao WebSocket no NotificationsContext...");

    const newSocket = io(import.meta.env.VITE_WS_URL, {
      auth: { token },
    });

    newSocket.on("connect", () => {
      console.log("✅ WebSocket conectado no NotificationsContext");
      setSocket(newSocket);
    });

    newSocket.on("disconnect", () => {
      console.log("❌ WebSocket desconectado no NotificationsContext");
      setSocket(null);
    });

    return () => {
      console.log("🧹 Desconectando WebSocket no NotificationsContext");
      newSocket.disconnect();
      setSocket(null);
    };
  }, [user?.id]);

  // Registrar listeners de notificação
  useEffect(() => {
    if (!socket) {
      console.log("Aguardando socket no NotificationsContext...");
      return;
    }

    console.log("Registrando listeners de notificação no socket");

    const handleTaskCreated = (data: INotificationWebSocket) => {
      console.log("🔔 NotificationsContext recebeu task:created:", data);
      console.log("User ID:", user?.id, "Assigned:", data.assignedUserIds);
      
      console.log("Adicionando notificação de tarefa atribuída");
      addNotification({
        type: "task_assigned",
        title: "Nova tarefa atribuída",
        message: data.message || `Você foi atribuído à tarefa: ${data.title || ""}`,
        taskId: data.taskId,
      });
      toast.success("Nova tarefa atribuída a você!");
    };

    const handleTaskUpdated = (data: INotificationWebSocket) => {
      console.log("NotificationsContext recebeu task:updated:", data);
      
      console.log("Adicionando notificação de tarefa atualizada");
      addNotification({
        type: "task_updated",
        title: "Tarefa atualizada",
        message: data.message || `A tarefa "${data.title || ""}" foi atualizada`,
        taskId: data.taskId,
      });
      toast.info("🔄 Tarefa atualizada");
    };

    const handleTaskDeleted = (data: INotificationWebSocket) => {
      console.log("NotificationsContext recebeu task:deleted:", data);
      addNotification({
        type: "task_deleted",
        title: "Tarefa deletada",
        message: data.message || "Uma tarefa foi deletada",
        taskId: data.taskId,
      });
      toast.error("🗑️ Tarefa deletada");
    };

    const handleCommentNew = (data: INotificationWebSocket) => {
      console.log("NotificationsContext recebeu comment:new:", data);
      addNotification({
        type: "comment_added",
        title: "Novo comentário",
        message: data.message || "Novo comentário em uma tarefa",
        taskId: data.taskId,
      });
      toast.info("💬 Novo comentário");
    };

    socket.on("task:created", handleTaskCreated);
    socket.on("task:updated", handleTaskUpdated);
    socket.on("task:deleted", handleTaskDeleted);
    socket.on("comment:new", handleCommentNew);

    return () => {
      console.log("🧹 Removendo listeners do NotificationsContext");
      socket.off("task:created", handleTaskCreated);
      socket.off("task:updated", handleTaskUpdated);
      socket.off("task:deleted", handleTaskDeleted);
      socket.off("comment:new", handleCommentNew);
    };
  }, [socket, user?.id]);

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearAll,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within NotificationsProvider"
    );
  }
  return context;
}
