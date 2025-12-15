import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

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

  async handleConnection(client: Socket) {
    try {
      // Extrair token do handshake
      const token =
        client.handshake.auth.token || client.handshake.headers.authorization;

      if (!token) {
        console.log('❌ WebSocket: Token não fornecido');
        client.disconnect();
        return;
      }

      // Validar token
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_SECRET'),
      });

      const userId = payload.sub;

      // Mapear userId ao socketId
      this.userSockets.set(userId, client.id);
      client.data.userId = userId;

      console.log(
        `✅ WebSocket conectado: User ${userId} -> Socket ${client.id}`,
      );
      console.log(`👥 Usuários conectados:  ${this.userSockets.size}`);

      // Enviar confirmação
      client.emit('connected', {
        message: 'Conectado ao servidor de notificações',
      });
    } catch (error) {
      console.log('❌ WebSocket: Token inválido', error.message);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      this.userSockets.delete(userId);
      console.log(`❌ WebSocket desconectado: User ${userId}`);
      console.log(`👥 Usuários conectados: ${this.userSockets.size}`);
    }
  }

  // Enviar notificação para um usuário específico
  sendToUser(userId: string, event: string, data: any) {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.server.to(socketId).emit(event, data);
      console.log(`📤 Evento enviado para ${userId}: ${event}`);
    } else {
      console.log(`⚠️ Usuário ${userId} não está conectado via WebSocket`);
    }
  }

  // Broadcast para todos
  broadcast(event: string, data: any) {
    this.server.emit(event, data);
    console.log(`📢 Broadcast:  ${event}`);
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    return { event: 'pong', data: { timestamp: new Date().toISOString() } };
  }
}
