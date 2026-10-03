import { jest } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';

const user = (id: number, role: string) => ({ id, email: `u${id}@x.com`, role });

describe('UserController authorization', () => {
  const service = {
    findAll: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    updatePassword: jest.fn(),
    delete: jest.fn(),
  };
  const controller = new UserController(service as unknown as UserService);
  const dto = { fullName: 'N', email: 'n@x.com', password: 'p4ssword', confirmPassword: 'p4ssword' };

  beforeEach(() => jest.clearAllMocks());

  it('regular users cannot create accounts', () => {
    expect(() => controller.createUser({ ...dto, role: 'superadmin' }, user(2, 'user'))).toThrow(ForbiddenException);
    expect(service.create).not.toHaveBeenCalled();
  });

  it('admins can create admins but not superadmins', () => {
    controller.createUser({ ...dto, role: 'admin' }, user(1, 'admin'));
    expect(service.create).toHaveBeenCalled();
    expect(() => controller.createUser({ ...dto, role: 'superadmin' }, user(1, 'admin'))).toThrow(ForbiddenException);
  });

  it('users cannot change their own role', () => {
    expect(() => controller.updateUser(2, { role: 'superadmin' }, user(2, 'user'))).toThrow(ForbiddenException);
    expect(service.update).not.toHaveBeenCalled();
  });

  it('resubmitting the current role is allowed', () => {
    controller.updateUser(1, { fullName: 'A', role: 'admin' }, user(1, 'admin'));
    expect(service.update).toHaveBeenCalledWith(1, { fullName: 'A', role: 'admin' });
  });

  it('superadmins can change roles of others', () => {
    controller.updateUser(5, { role: 'admin' }, user(1, 'superadmin'));
    expect(service.update).toHaveBeenCalledWith(5, { role: 'admin' });
  });

  it('users cannot read or edit other users', () => {
    expect(() => controller.getUser(1, user(2, 'user'))).toThrow(ForbiddenException);
    expect(() => controller.updateUser(1, { fullName: 'x' }, user(2, 'user'))).toThrow(ForbiddenException);
    expect(() => controller.updatePassword(1, {} as any, user(2, 'superadmin'))).toThrow(ForbiddenException);
  });

  it('admins can read any user; only superadmins delete', () => {
    controller.getUser(5, user(1, 'admin'));
    expect(service.findById).toHaveBeenCalledWith(5);
    expect(() => controller.deleteUser(5, user(1, 'admin'))).toThrow(ForbiddenException);
  });
});
