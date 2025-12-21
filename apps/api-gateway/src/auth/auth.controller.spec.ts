/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { ThrottlerGuard } from '@nestjs/throttler';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthResponse = {
    user: {
      id: '123',
      email: 'test@example.com',
      username: 'testuser',
    },
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
  };

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    refresh: jest.fn(),
    getAllUsers: jest.fn(),
  };

  const mockLogger = {
    info: jest.fn(() => undefined),
    error: jest.fn(() => undefined),
    warn: jest.fn(() => undefined),
    debug: jest.fn(() => undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: WINSTON_MODULE_PROVIDER as string,
          useValue: mockLogger,
        },
      ],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      email: 'newuser@example.com',
      username: 'newuser',
      password: 'password123',
    };

    it('should successfully register a new user', async () => {
      mockAuthService.register.mockResolvedValue(mockAuthResponse);

      const result = await controller.register(registerDto);

      expect(result).toEqual(mockAuthResponse);
      expect(authService.register).toHaveBeenCalledWith(registerDto);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Registering new user',
        expect.objectContaining({ username: registerDto.username }),
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'User registered successfully',
        expect.objectContaining({ username: registerDto.username }),
      );
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      emailOrUsername: 'test@example.com',
      password: 'password123',
    };

    it('should successfully login a user', async () => {
      mockAuthService.login.mockResolvedValue(mockAuthResponse);

      const result = await controller.login(loginDto);

      expect(result).toEqual(mockAuthResponse);
      expect(authService.login).toHaveBeenCalledWith(loginDto);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Login attempt',
        expect.objectContaining({ emailOrUsername: loginDto.emailOrUsername }),
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Login successful',
        expect.objectContaining({ emailOrUsername: loginDto.emailOrUsername }),
      );
    });
  });

  describe('refresh', () => {
    const refreshTokenDto: RefreshTokenDto = {
      refreshToken: 'valid-refresh-token',
    };

    it('should successfully refresh tokens', async () => {
      const refreshResponse = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };
      mockAuthService.refresh.mockResolvedValue(refreshResponse);

      const result = await controller.refresh(refreshTokenDto);

      expect(result).toEqual(refreshResponse);
      expect(authService.refresh).toHaveBeenCalledWith(refreshTokenDto);
    });
  });

  describe('getAllUsers', () => {
    it('should return list of users', async () => {
      const users = [
        { id: '1', email: 'user1@example.com', username: 'user1' },
        { id: '2', email: 'user2@example.com', username: 'user2' },
      ];
      mockAuthService.getAllUsers.mockResolvedValue(users);

      const result = await controller.getAllUsers();

      expect(result).toEqual(users);
      expect(authService.getAllUsers).toHaveBeenCalled();
    });
  });
});
