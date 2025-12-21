import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { User } from './entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: Repository<User>;
  let jwtService: JwtService;
  let configService: ConfigService;

  const mockUser = {
    id: '123',
    email: 'test@example.com',
    username: 'testuser',
    password: 'hashedPassword',
    refreshToken: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    find: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        JWT_SECRET: 'test-secret',
        JWT_EXPIRES_IN: '15m',
        JWT_REFRESH_SECRET: 'test-refresh-secret',
        JWT_REFRESH_EXPIRES_IN: '7d',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      email: 'newuser@example.com',
      username: 'newuser',
      password: 'password123',
    };

    it('should successfully register a new user', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);
      mockJwtService.signAsync.mockResolvedValueOnce('access-token');
      mockJwtService.signAsync.mockResolvedValueOnce('refresh-token');

      const result = await service.register(registerDto);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe(mockUser.email);
      expect(mockUserRepository.findOne).toHaveBeenCalled();
      expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if user already exists', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      emailOrUsername: 'test@example.com',
      password: 'password123',
    };

    it('should successfully login a user with valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const userWithHashedPassword = { ...mockUser, password: hashedPassword };

      mockUserRepository.findOne.mockResolvedValue(userWithHashedPassword);
      mockJwtService.signAsync.mockResolvedValueOnce('access-token');
      mockJwtService.signAsync.mockResolvedValueOnce('refresh-token');

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(mockUserRepository.findOne).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refreshToken', () => {
    it('should successfully refresh tokens', async () => {
      const refreshToken = 'valid-refresh-token';
      const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
      const userWithRefreshToken = {
        ...mockUser,
        refreshToken: hashedRefreshToken,
      };

      mockJwtService.verifyAsync.mockResolvedValue({
        sub: mockUser.id,
        email: mockUser.email,
        username: mockUser.username,
      });
      mockUserRepository.findOne.mockResolvedValue(userWithRefreshToken);
      mockJwtService.signAsync.mockResolvedValueOnce('new-access-token');
      mockJwtService.signAsync.mockResolvedValueOnce('new-refresh-token');

      const result = await service.refreshToken(refreshToken);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(mockJwtService.verifyAsync).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if refresh token is invalid', async () => {
      mockJwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

      await expect(service.refreshToken('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('validateUser', () => {
    it('should return user if exists', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.validateUser(mockUser.id);

      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
    });

    it('should return null if user does not exist', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.validateUser('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return array of users without sensitive data', async () => {
      const users = [
        {
          id: '1',
          email: 'user1@example.com',
          username: 'user1',
          createdAt: new Date(),
        },
        {
          id: '2',
          email: 'user2@example.com',
          username: 'user2',
          createdAt: new Date(),
        },
      ];
      mockUserRepository.find.mockResolvedValue(users);

      const result = await service.findAll();

      expect(result).toEqual(users);
      expect(mockUserRepository.find).toHaveBeenCalledWith({
        select: ['id', 'email', 'username', 'createdAt'],
      });
    });
  });
});
