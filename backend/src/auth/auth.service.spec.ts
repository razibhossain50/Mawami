import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { User } from '../user/user.entity';

describe('AuthService', () => {
  let service: AuthService;
  const env: Record<string, string | undefined> = {};
  const repo = {
    findOne: jest.fn(),
    create: jest.fn((data: any) => data),
    save: jest.fn(async (data: any) => data),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    for (const key of Object.keys(env)) delete env[key];
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: repo },
        { provide: JwtService, useValue: { sign: () => 'token' } },
        { provide: ConfigService, useValue: { get: (key: string) => env[key] } },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('createSuperAdmin', () => {
    it('does nothing when the env vars are not set', async () => {
      await service.createSuperAdmin();
      expect(repo.findOne).not.toHaveBeenCalled();
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('creates a missing superadmin with a hashed password', async () => {
      Object.assign(env, { SUPERADMIN_EMAIL: ' Boss@Example.com ', SUPERADMIN_PASSWORD: 'S3cret!pass' });
      repo.findOne.mockResolvedValueOnce(null as never);

      await service.createSuperAdmin();

      const saved = repo.save.mock.calls[0][0];
      expect(saved).toMatchObject({ email: 'boss@example.com', role: 'superadmin' });
      expect(await bcrypt.compare('S3cret!pass', saved.password)).toBe(true);
    });

    it('never touches an existing account', async () => {
      Object.assign(env, { SUPERADMIN_EMAIL: 'boss@example.com', SUPERADMIN_PASSWORD: 'other' });
      repo.findOne.mockResolvedValueOnce({ id: 1, email: 'boss@example.com', role: 'superadmin' } as never);

      await service.createSuperAdmin();

      expect(repo.save).not.toHaveBeenCalled();
    });
  });
});
