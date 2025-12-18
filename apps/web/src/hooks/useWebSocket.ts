import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";

export const useWebSocket = (userId: string | null) => {
  const socketRef = useRef<Socket | null>(null);
  
  useEffect(() => {
    if (!userId) return;

    const token = localStorage.getItem("accessToken");
    if (!token) return;

    const socket = io(import.meta.env.VITE_WS_URL, {
      auth: { token },
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      // console.log("WebSocket conectado");
    });

    socket.on("connected", (data) => {
      // console.log("Servidor confirmou:", data);
    });

    socket.on("task:created", (data) => {
      // console.log("Nova tarefa:", data);
      toast(`${data.message}`);
    });

    socket.on("task:updated", (data) => {
      // console.log("Tarefa atualizada:", data);
      toast(`${data.message}`);
    });

    socket.on("comment:new", (data) => {
      // console.log("Novo comentário:", data);
      toast(`${data.message}`);
    });

    socket.on("disconnect", () => {
      // console.log("WebSocket desconectado");
    });

    return () => {
      socket.disconnect();
    };
  }, [userId]);

  return socketRef.current;
};
