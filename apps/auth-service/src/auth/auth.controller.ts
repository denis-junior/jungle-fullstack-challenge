import { Controller, HttpException, HttpStatus } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
// import { RefreshTokenDto } from './dto/refresh-token.dto';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private handleRpcError(error: unknown): never {
    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Erro interno do servidor';

    if (error instanceof HttpException) {
      statusCode = error.getStatus();
      const response = error.getResponse();
      message =
        typeof response === 'string'
          ? response
          : (response as { message?: string }).message || error.message;
    } else if (error instanceof Error) {
      message = error.message;
    }

    throw new RpcException({
      statusCode,
      message,
      error: error instanceof Error ? error.constructor.name : 'Unknown',
    });
  }

  // Padrões de mensagem para RabbitMQ
  @MessagePattern({ cmd: 'register' })
  async register(@Payload() registerDto: RegisterDto) {
    try {
      return await this.authService.register(registerDto);
    } catch (error) {
      this.handleRpcError(error);
    }
  }

  @MessagePattern({ cmd: 'login' })
  async login(@Payload() loginDto: LoginDto) {
    try {
      return await this.authService.login(loginDto);
    } catch (error) {
      this.handleRpcError(error);
    }
  }

  @MessagePattern({ cmd: 'refresh' })
  async refresh(@Payload() data: { refreshToken: string }) {
    try {
      return await this.authService.refreshToken(data.refreshToken);
    } catch (error) {
      this.handleRpcError(error);
    }
  }

  @MessagePattern({ cmd: 'validate-user' })
  async validateUser(@Payload() userId: string) {
    try {
      return await this.authService.validateUser(userId);
    } catch (error) {
      this.handleRpcError(error);
    }
  }

  @MessagePattern({ cmd: 'find-all-users' })
  async findAllUsers() {
    try {
      return await this.authService.findAll();
    } catch (error) {
      this.handleRpcError(error);
    }
  }

  @MessagePattern({ cmd: 'find-users-by-ids' })
  async findUsersByIds(@Payload() data: { userIds: string[] }) {
    try {
      return await this.authService.findUsersByIds(data.userIds);
    } catch (error) {
      this.handleRpcError(error);
    }
  }
}
