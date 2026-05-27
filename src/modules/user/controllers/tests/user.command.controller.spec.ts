import { Test, TestingModule } from '@nestjs/testing';
import { UserCommandController } from '../command/user.command.controller';
import { UserService, AuthService } from '@volontariapp/domain-user';
import { UserTransformer } from '../../transformers/user.transformer';
import { UpdateUserCommandDTO } from '../../dto/request/command/update-user.command.dto';
import { DeleteUserCommandDTO } from '../../dto/request/command/delete-user.command.dto';
import { AdminUpdateUserCommandDTO } from '../../dto/request/command/admin-update-user.command.dto';
import { AdminDeleteUserCommandDTO } from '../../dto/request/command/admin-delete-user.command.dto';
import { UserFactory } from '../../../../__test-utils__/factories/user.factory';
import type { AuthUser } from '@volontariapp/auth';
import { JwtService } from '@volontariapp/auth';

import { DataSource } from 'typeorm';
import { getDataSourceToken } from '@nestjs/typeorm';
import { JobsOutboxModel } from '@volontariapp/database';
import { JobsOutboxRepository } from '@volontariapp/outbox';
import { NotFoundError, PartialContentError } from '@volontariapp/errors';
import { UserJobType } from '@volontariapp/messaging';

describe('UserCommandController', () => {
  let controller: UserCommandController;
  let userService: Partial<UserService>;
  let authService: Partial<AuthService>;
  let userTransformer: Partial<UserTransformer>;
  let mockJobsOutboxRepo: { save: jest.Mock };
  let mockDataSource: Partial<DataSource>;

  const mockAuthUser: AuthUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    role: 'VOLUNTEER',
  };

  const mockAdminUser: AuthUser = {
    id: 'admin-id',
    role: 'ADMIN',
  };

  beforeEach(async () => {
    userService = {
      update: jest.fn().mockResolvedValue(UserFactory.create()),
      delete: jest.fn().mockResolvedValue(undefined),
    };

    authService = {
      signUp: jest.fn(),
      logIn: jest.fn(),
      refreshTokens: jest.fn(),
    };

    userTransformer = {
      toUserDTO: jest.fn().mockReturnValue({ id: '123e4567-e89b-12d3-a456-426614174000' }),
      toUpdateUserInput: jest.fn().mockReturnValue({
        pseudo: 'updated',
        bio: null,
      }),
      toSignUpInput: jest.fn(),
    };

    mockJobsOutboxRepo = {
      save: jest.fn().mockResolvedValue({ id: 'job-123' }),
    };

    mockDataSource = {
      getRepository: jest.fn().mockImplementation((model) => {
        if (model === JobsOutboxModel) return mockJobsOutboxRepo;
        return {};
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserCommandController],
      providers: [
        { provide: UserService, useValue: userService },
        { provide: AuthService, useValue: authService },
        { provide: UserTransformer, useValue: userTransformer },
        { provide: JwtService, useValue: { verifyInternal: jest.fn() } },
        { provide: getDataSourceToken(), useValue: mockDataSource },
      ],
    }).compile();

    controller = module.get<UserCommandController>(UserCommandController);
  });

  describe('updateUser with authentication', () => {
    it('should update user profile with JWT token', async () => {
      const updateDto = new UpdateUserCommandDTO();
      updateDto.pseudo = 'newpseudo';

      const result = await controller.updateUser(updateDto, mockAuthUser);

      expect(userService.update).toHaveBeenCalledWith(expect.anything(), expect.anything());
      expect(result).toEqual({
        user: { id: '123e4567-e89b-12d3-a456-426614174000' },
      });
    });

    it('should use userId from JWT token, not from DTO', async () => {
      const updateDto = new UpdateUserCommandDTO();
      updateDto.email = 'newemail@example.com';

      await controller.updateUser(updateDto, mockAuthUser);

      expect(userService.update).toHaveBeenCalledWith(
        expect.objectContaining({ value: mockAuthUser.id }),
        expect.anything(),
      );
    });
  });

  describe('deleteUser with authentication', () => {
    it('should delete user with JWT token', async () => {
      const deleteDto = new DeleteUserCommandDTO();

      await controller.deleteUser(deleteDto, mockAuthUser);

      expect(userService.delete).toHaveBeenCalledWith(
        expect.objectContaining({ value: mockAuthUser.id }),
      );
    });
  });

  describe('adminUpdateUser (admin only)', () => {
    it('should allow admin to update another user', async () => {
      const adminUpdateDto = new AdminUpdateUserCommandDTO();
      adminUpdateDto.userId = 'other-user-id';
      adminUpdateDto.pseudo = 'updated-by-admin';

      const result = await controller.adminUpdateUser(adminUpdateDto);

      expect(userService.update).toHaveBeenCalledWith(
        expect.objectContaining({ value: 'other-user-id' }),
        expect.anything(),
      );
      expect(result).toEqual({});
    });
  });

  describe('adminDeleteUser (admin only)', () => {
    it('should allow admin to delete another user', async () => {
      const adminDeleteDto = new AdminDeleteUserCommandDTO();
      adminDeleteDto.userId = 'other-user-id';

      const result = await controller.adminDeleteUser(adminDeleteDto);

      expect(userService.delete).toHaveBeenCalledWith(
        expect.objectContaining({ value: 'other-user-id' }),
      );
      expect(result).toEqual({});
    });
  });

  describe('Fallback mechanism', () => {
    let createSpy: jest.SpiedFunction<typeof JobsOutboxRepository.prototype.create>;

    beforeEach(() => {
      createSpy = jest
        .spyOn(JobsOutboxRepository.prototype, 'create')
        .mockImplementation(() => Promise.resolve({} as never));
    });

    afterEach(() => {
      createSpy.mockRestore();
    });

    it('should create a fallback job in outbox when an unexpected error occurs during a command', async () => {
      const mockError = new Error('Unexpected DB failure');
      const spyGetRepo = jest.spyOn(mockDataSource, 'getRepository');
      userService.delete = jest.fn().mockRejectedValue(mockError);

      const deleteDto = new DeleteUserCommandDTO();

      await expect(controller.deleteUser(deleteDto, mockAuthUser)).rejects.toThrow(
        PartialContentError,
      );

      expect(spyGetRepo).toHaveBeenCalledWith(JobsOutboxModel);

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: UserJobType.FALLBACK_DELETE_USER,
          emitter: 'ms-user',
          emitterId: mockAuthUser.id,
          target: 'fallback-user-queue',
        }),
      );
    });

    it('should NOT create a fallback job for a 404 or 409 Api Error', async () => {
      const mockApiError = new NotFoundError('Not found');

      userService.delete = jest.fn().mockRejectedValue(mockApiError);

      const deleteDto = new DeleteUserCommandDTO();

      await expect(controller.deleteUser(deleteDto, mockAuthUser)).rejects.toThrow('Not found');

      expect(createSpy).not.toHaveBeenCalled();
    });
  });
});
