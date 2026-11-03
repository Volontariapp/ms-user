import { jest } from '@jest/globals';
import type { UserService } from '@volontariapp/domain-user';

export type UserServiceMock = Pick<UserService, 'findById' | 'findAll' | 'findPage' | 'findByIds'>;

export const createUserServiceMock = (): jest.Mocked<UserServiceMock> => ({
  findById: jest.fn<UserService['findById']>(),
  findAll: jest.fn<UserService['findAll']>(),
  findPage: jest.fn<UserService['findPage']>(),
  findByIds: jest.fn<UserService['findByIds']>(),
});
