import { Injectable, Inject, HttpException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, catchError } from 'rxjs';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { IAuthResponse } from 'src/interfaces';

@Injectable()
export class AuthService {
  constructor(@Inject('AUTH_SERVICE') private authClient: ClientProxy) {}

  private handleRpcError(error: unknown): never {
    if (this.isRpcError(error)) {
      const statusCode = error.statusCode ?? error.status ?? 500;
      const message = error.message || 'Internal server error';
      throw new HttpException(message, statusCode);
    }

    if (error instanceof Error) {
      throw new HttpException(error.message, 500);
    }

    throw new HttpException('Internal server error', 500);
  }

  private isRpcError(
    error: unknown,
  ): error is { statusCode?: number; status?: number; message?: string } {
    return (
      typeof error === 'object' &&
      error !== null &&
      ('statusCode' in error || 'status' in error)
    );
  }

  async register(registerDto: RegisterDto): Promise<IAuthResponse> {
    return firstValueFrom<IAuthResponse>(
      this.authClient.send({ cmd: 'register' }, registerDto).pipe(
        catchError((error) => {
          this.handleRpcError(error);
        }),
      ),
    );
  }

  async login(loginDto: LoginDto): Promise<IAuthResponse> {
    return firstValueFrom<IAuthResponse>(
      this.authClient.send({ cmd: 'login' }, loginDto).pipe(
        catchError((error) => {
          this.handleRpcError(error);
        }),
      ),
    );
  }

  async refresh(refreshTokenDto: RefreshTokenDto): Promise<IAuthResponse> {
    return firstValueFrom<IAuthResponse>(
      this.authClient
        .send(
          { cmd: 'refresh' },
          { refreshToken: refreshTokenDto.refreshToken },
        )
        .pipe(
          catchError((error) => {
            this.handleRpcError(error);
          }),
        ),
    );
  }

  async validateUser(userId: string): Promise<IAuthResponse> {
    return firstValueFrom<IAuthResponse>(
      this.authClient.send({ cmd: 'validate-user' }, userId).pipe(
        catchError((error) => {
          this.handleRpcError(error);
        }),
      ),
    );
  }

  async getAllUsers(): Promise<IAuthResponse> {
    return firstValueFrom<IAuthResponse>(
      this.authClient.send({ cmd: 'find-all-users' }, {}).pipe(
        catchError((error) => {
          this.handleRpcError(error);
        }),
      ),
    );
  }
}
