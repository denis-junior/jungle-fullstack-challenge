import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { IStatusChangedPayload } from './interfaces';

interface SocketData {
  userId: string;
}

interface JwtPayload {
  sub: string;
  email: string;
  username: string;
  iat?: number;
  exp?: number;
}

interface AuthenticatedSocket extends Socket {
  data: SocketData;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  // Mapa de userId -> socketId
  private userSockets = new Map<string, string>();

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  handleConnection(client: AuthenticatedSocket) {
    try {
      // Extrair token do handshake
      const token = (client.handshake.auth.token ||
        client.handshake.headers.authorization) as string | undefined;

      if (!token) {
        console.log('WebSocket: Token não fornecido');
        client.disconnect();
        return;
      }

      // Validar token
      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      const userId: string = payload.sub;

      this.userSockets.set(userId, client.id);
      // Type assertion para garantir type safety
      client.data.userId = userId;

      console.log(`WebSocket conectado: User ${userId} -> Socket ${client.id}`);
      console.log(`Usuários conectados:  ${this.userSockets.size}`);

      // Enviar confirmação
      client.emit('connected', {
        message: 'Conectado ao servidor de notificações',
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.log(`WebSocket: Token inválido`, errorMessage);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    const userId = client.data.userId;
    if (userId) {
      this.userSockets.delete(userId);
      console.log(`WebSocket desconectado: User ${userId}`);
      console.log(`Usuários conectados: ${this.userSockets.size}`);
    }
  }

  // Enviar notificação para um usuário específico
  sendToUser(userId: string, event: string, data: IStatusChangedPayload) {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.server.to(socketId).emit(event, data);
      console.log(`Evento enviado para ${userId}: ${event}`);
    } else {
      console.log(`Usuário ${userId} não está conectado via WebSocket`);
    }
  }

  // Broadcast para todos
  broadcast(event: string, data: unknown) {
    this.server.emit(event, data);
    console.log(`Broadcast:  ${event}`);
  }

  @SubscribeMessage('ping')
  handlePing() {
    return { event: 'pong', data: { timestamp: new Date().toISOString() } };
  }
}
