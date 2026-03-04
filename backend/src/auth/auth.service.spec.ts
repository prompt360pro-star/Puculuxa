import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user without password if credentials are valid', async () => {
      const user = {
        id: '1',
        email: 'test@test.com',
        password: 'hashedpassword',
        role: 'CUSTOMER',
      };
      mockPrismaService.user.findUnique.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser(
        'test@test.com',
        'plainpassword',
      );

      expect(result).toEqual({
        id: '1',
        email: 'test@test.com',
        role: 'CUSTOMER',
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'plainpassword',
        'hashedpassword',
      );
    });

    it('should return null if password does not match', async () => {
      const user = {
        id: '1',
        email: 'test@test.com',
        password: 'hashedpassword',
      };
      mockPrismaService.user.findUnique.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser(
        'test@test.com',
        'wrongpassword',
      );

      expect(result).toBeNull();
    });

    it('should return null if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.validateUser(
        'notfound@test.com',
        'password',
      );

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return access token, refresh token and user info', async () => {
      const user = {
        id: '1',
        email: 'test@test.com',
        name: 'Test User',
        role: 'CUSTOMER',
      };

      // First call for access token, second for refresh token
      mockJwtService.sign
        .mockReturnValueOnce('mock-access-token')
        .mockReturnValueOnce('mock-refresh-token');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-refresh-token');
      mockPrismaService.user.update.mockResolvedValue({});

      const result = await service.login(user as any);

      expect(result).toEqual({
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        user: {
          id: '1',
          email: 'test@test.com',
          name: 'Test User',
          role: 'CUSTOMER',
        },
      });
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        email: 'test@test.com',
        sub: '1',
        role: 'CUSTOMER',
      });
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        { email: 'test@test.com', sub: '1', role: 'CUSTOMER' },
        { expiresIn: '7d' },
      );
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { refreshToken: 'hashed-refresh-token' },
      });
    });
  });

  describe('refreshToken', () => {
    it('should return new tokens if refresh token is valid', async () => {
      const user = {
        id: '1',
        email: 'test@test.com',
        password: 'pwd',
        refreshToken: 'hashed-token',
        role: 'CUSTOMER',
      };
      mockPrismaService.user.findUnique.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.verify = jest.fn().mockReturnValue(true);

      // Mocks for login method called inside refreshToken
      mockJwtService.sign
        .mockReturnValueOnce('new-access')
        .mockReturnValueOnce('new-refresh');
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-refresh');
      mockPrismaService.user.update.mockResolvedValue({});

      const result = await service.refreshToken('1', 'valid-token');

      expect(result).toEqual({
        access_token: 'new-access',
        refresh_token: 'new-refresh',
        user: { id: '1', email: 'test@test.com', role: 'CUSTOMER' },
      });
    });

    it('should return null if user not found or no refresh token stored', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      const result = await service.refreshToken('1', 'valid-token');
      expect(result).toBeNull();
    });

    it('should return null if refresh token does not match', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: '1',
        refreshToken: 'hashed',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      const result = await service.refreshToken('1', 'invalid-token');
      expect(result).toBeNull();
    });
  });

  describe('register', () => {
    it('should hash password and create user returning data without password', async () => {
      const registerDto = {
        email: 'new@test.com',
        password: 'password',
        name: 'New User',
        phone: '123',
      };
      const createdUser = {
        id: '2',
        ...registerDto,
        password: 'hashedpassword',
        role: 'CUSTOMER',
      };

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');
      mockPrismaService.user.create.mockResolvedValue(createdUser);

      const result = await service.register(registerDto);

      expect(result).toEqual({
        id: '2',
        email: 'new@test.com',
        name: 'New User',
        phone: '123',
        role: 'CUSTOMER',
      });
      expect(bcrypt.hash).toHaveBeenCalledWith('password', 10);
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: 'new@test.com',
          password: 'hashedpassword',
          name: 'New User',
          phone: '123',
          role: 'CUSTOMER',
        },
      });
    });
  });
});
