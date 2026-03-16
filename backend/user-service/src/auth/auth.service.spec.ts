import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UserRole } from '../common/interfaces/jwt-payload.interface';
import { UsersService } from '../users/users.service';

jest.mock('bcrypt');

describe('AuthService', () => {
  let authService: AuthService;
  const usersService = {
    createUser: jest.fn(),
    findByEmail: jest.fn(),
  };
  const jwtService = {
    signAsync: jest.fn().mockResolvedValue('token'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  it('should register and return token', async () => {
    (bcrypt.hash as jest.Mock).mockResolvedValue('hash');
    usersService.createUser.mockResolvedValue({
      _id: { toString: () => '1' },
      email: 'john@mail.com',
      fullName: 'John',
      role: UserRole.User,
    });

    const result = await authService.register({
      email: 'john@mail.com',
      fullName: 'John',
      password: 'StrongPass1',
    });

    expect(result.accessToken).toBe('token');
    expect(usersService.createUser).toHaveBeenCalled();
  });

  it('should fail login with invalid credentials', async () => {
    usersService.findByEmail.mockResolvedValue(null);

    await expect(
      authService.login({ email: 'john@mail.com', password: 'StrongPass1' }),
    ).rejects.toThrow('Invalid credentials');
  });
});
