import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { IAuthResponse } from 'src/interfaces';

@Injectable()
export class AuthService {
  constructor(@Inject('AUTH_SERVICE') private authClient: ClientProxy) {}

  async register(registerDto: RegisterDto): Promise<IAuthResponse> {
    return firstValueFrom(
      this.authClient.send({ cmd: 'register' }, registerDto),
    );
  }

  async login(loginDto: LoginDto): Promise<IAuthResponse> {
    return firstValueFrom(this.authClient.send({ cmd: 'login' }, loginDto));
  }

  async refresh(refreshTokenDto: RefreshTokenDto): Promise<IAuthResponse> {
    return firstValueFrom(
      this.authClient.send(
        { cmd: 'refresh' },
        { refreshToken: refreshTokenDto.refreshToken },
      ),
    );
  }

  async validateUser(userId: string): Promise<IAuthResponse> {
    return firstValueFrom(
      this.authClient.send({ cmd: 'validate-user' }, userId),
    );
  }

  async getAllUsers(): Promise<IAuthResponse> {
    return firstValueFrom(this.authClient.send({ cmd: 'find-all-users' }, {}));
  }
}
