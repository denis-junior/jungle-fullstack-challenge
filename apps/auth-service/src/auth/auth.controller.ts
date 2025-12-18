import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
// import { RefreshTokenDto } from './dto/refresh-token.dto';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Padrões de mensagem para RabbitMQ
  @MessagePattern({ cmd: 'register' })
  async register(@Payload() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @MessagePattern({ cmd: 'login' })
  async login(@Payload() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @MessagePattern({ cmd: 'refresh' })
  async refresh(@Payload() data: { refreshToken: string }) {
    return this.authService.refreshToken(data.refreshToken);
  }

  @MessagePattern({ cmd: 'validate-user' })
  async validateUser(@Payload() userId: string) {
    return this.authService.validateUser(userId);
  }

  @MessagePattern({ cmd: 'find-all-users' })
  async findAllUsers() {
    return this.authService.findAll();
  }

  @MessagePattern({ cmd: 'find-users-by-ids' })
  async findUsersByIds(@Payload() data: { userIds: string[] }) {
    return this.authService.findUsersByIds(data.userIds);
  }
}
