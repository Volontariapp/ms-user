import { Test, TestingModule } from '@nestjs/testing';
import { UserCommandController } from '../command/user.command.controller.js';
import { UserService, AuthService, UserStatus } from '@volontariapp/domain-user';
import { UserTransformer } from '../../transformers/user.transformer.js';
import { UpdateUserCommandDTO } from '../../dto/request/command/update-user.command.dto.js';
import { DeleteUserCommandDTO } from '../../dto/request/command/delete-user.command.dto.js';
import { AdminUpdateUserCommandDTO } from '../../dto/request/command/admin-update-user.command.dto.js';
import { AdminDeleteUserCommandDTO } from '../../dto/request/command/admin-delete-user.command.dto.js';
import { LoginCommandDTO } from '../../dto/request/command/login.command.dto.js';
import { RefreshTokenCommandDTO } from '../../dto/request/command/refresh-token.command.dto.js';
import { UserFactory } from '../../../../__test-utils__/factories/user.factory.js';
import type { AuthUser } from '@volontariapp/auth';
import { JwtService } from '@volontariapp/auth';

import { DataSource } from 'typeorm';
import { getDataSourceToken } from '@nestjs/typeorm';
import { JobsOutboxModel } from '@volontariapp/database';
import { JobsOutboxRepository } from '@volontariapp/outbox';
import {
  GrpcStatus,
  NotFoundError,
  PartialContentError,
  UnauthorizedError,
} from '@volontariapp/errors';
import { UserJobType } from '@volontariapp/messaging';
import {
  StorageClientService,
  StorageUnavailableError,
  StorageRelayedError,
  FILE_NOT_FOUND,
  STORAGE_TIMEOUT,
  STORAGE_ATTACHMENT_FAILED,
} from '@volontariapp/storage-client';
import {
  createMockStorageClientService,
  type MockStorageClientService,
} from './storage-client.mock.js';

describe('UserCommandController', () => {
  let controller: UserCommandController;
  let userService: Partial<UserService>;
  let authService: Partial<AuthService>;
  let jwtService: Partial<JwtService>;
  let userTransformer: Partial<UserTransformer>;
  let storageClientService: MockStorageClientService;
  let mockJobsOutboxRepo: { save: jest.Mock };
  let mockDataSource: Partial<DataSource>;

  const mockAuthUser: AuthUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    role: 'VOLUNTEER',
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  beforeEach(async () => {
    storageClientService = createMockStorageClientService();
    userService = {
      update: jest.fn().mockResolvedValue(UserFactory.create()),
      requestDeletion: jest.fn().mockResolvedValue(undefined),
      findByEmail: jest.fn().mockResolvedValue(UserFactory.create({ status: UserStatus.ACTIVE })),
      findById: jest.fn().mockResolvedValue(UserFactory.create({ status: UserStatus.ACTIVE })),
    };

    authService = {
      signUp: jest.fn(),
      logIn: jest.fn().mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      }),
      refreshTokens: jest.fn().mockResolvedValue({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      }),
    };

    jwtService = {
      verifyInternal: jest.fn(),
      verifyRefreshToken: jest.fn().mockResolvedValue({
        id: mockAuthUser.id,
        role: mockAuthUser.role,
      }),
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
        { provide: JwtService, useValue: jwtService },
        { provide: UserTransformer, useValue: userTransformer },
        { provide: StorageClientService, useValue: storageClientService },
        { provide: getDataSourceToken(), useValue: mockDataSource },
      ],
    }).compile();

    controller = module.get<UserCommandController>(UserCommandController);
  });

  describe('login', () => {
    it('should return tokens when user account is active', async () => {
      const loginDto = new LoginCommandDTO();
      loginDto.email = 'test@example.com';
      loginDto.password = 'Password123!';

      const result = await controller.login(loginDto);

      expect(authService.logIn).toHaveBeenCalled();
      expect(userService.findByEmail).toHaveBeenCalled();
      expect(result).toEqual({
        auth: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
        },
      });
    });

    it('should reject login with USER_NOT_FOUND when user is PENDING_DELETION', async () => {
      userService.findByEmail = jest
        .fn()
        .mockResolvedValue(UserFactory.create({ status: UserStatus.PENDING_DELETION }));

      const loginDto = new LoginCommandDTO();
      loginDto.email = 'pending@example.com';
      loginDto.password = 'Password123!';

      await expect(controller.login(loginDto)).rejects.toThrow(NotFoundError);
    });
  });

  describe('refreshTokens', () => {
    it('should refresh tokens when user account is active', async () => {
      const refreshDto = new RefreshTokenCommandDTO();
      refreshDto.refreshToken = 'valid-refresh-token';

      const result = await controller.refreshTokens(refreshDto);

      expect(jwtService.verifyRefreshToken).toHaveBeenCalledWith('valid-refresh-token');
      expect(userService.findById).toHaveBeenCalled();
      expect(authService.refreshTokens).toHaveBeenCalled();
      expect(result).toEqual({
        auth: {
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
        },
      });
    });

    it('should reject refresh tokens with INVALID_REFRESH_TOKEN when user is PENDING_DELETION', async () => {
      userService.findById = jest
        .fn()
        .mockResolvedValue(UserFactory.create({ status: UserStatus.PENDING_DELETION }));

      const refreshDto = new RefreshTokenCommandDTO();
      refreshDto.refreshToken = 'valid-refresh-token';

      await expect(controller.refreshTokens(refreshDto)).rejects.toThrow(UnauthorizedError);
    });

    it('should reject refresh tokens when verifyRefreshToken fails', async () => {
      jwtService.verifyRefreshToken = jest.fn().mockRejectedValue(new Error('Invalid signature'));

      const refreshDto = new RefreshTokenCommandDTO();
      refreshDto.refreshToken = 'corrupt-token';

      await expect(controller.refreshTokens(refreshDto)).rejects.toThrow(UnauthorizedError);
    });
  });

  describe('updateUser with authentication', () => {
    it('should update user profile without avatar when avatarFileId is not provided', async () => {
      const updateDto = new UpdateUserCommandDTO();
      updateDto.pseudo = 'newpseudo';

      const result = await controller.updateUser(updateDto, mockAuthUser);

      expect(storageClientService.confirmUserAvatarAttachment).not.toHaveBeenCalled();
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

    it('should confirm avatar attachment and update profile when avatarFileId is provided (cas heureux)', async () => {
      const updateDto = new UpdateUserCommandDTO();
      updateDto.avatarFileId = '123e4567-e89b-12d3-a456-426614174000';
      const internalToken = 'test-internal-token';

      const result = await controller.updateUser(updateDto, mockAuthUser, internalToken);

      expect(storageClientService.confirmUserAvatarAttachment).toHaveBeenCalledWith(
        mockAuthUser.id,
        '123e4567-e89b-12d3-a456-426614174000',
        { internalToken },
      );
      expect(userService.update).toHaveBeenCalledWith(
        expect.objectContaining({ value: mockAuthUser.id }),
        expect.anything(),
      );
      expect(result).toEqual({
        user: { id: '123e4567-e89b-12d3-a456-426614174000' },
      });
    });

    it('should call confirmUserAvatarAttachment with undefined options when internalToken is omitted', async () => {
      const updateDto = new UpdateUserCommandDTO();
      updateDto.avatarFileId = '123e4567-e89b-12d3-a456-426614174000';

      await controller.updateUser(updateDto, mockAuthUser);

      expect(storageClientService.confirmUserAvatarAttachment).toHaveBeenCalledWith(
        mockAuthUser.id,
        '123e4567-e89b-12d3-a456-426614174000',
        undefined,
      );
    });

    it('should throw StorageUnavailableError (503) when ms-storage times out (isStorageUnavailable)', async () => {
      const updateDto = new UpdateUserCommandDTO();
      updateDto.avatarFileId = '123e4567-e89b-12d3-a456-426614174000';

      storageClientService.confirmUserAvatarAttachment.mockRejectedValue(
        STORAGE_TIMEOUT(mockAuthUser.id, 2000),
      );

      await expect(controller.updateUser(updateDto, mockAuthUser)).rejects.toThrow(
        StorageUnavailableError,
      );
      expect(userService.update).not.toHaveBeenCalled();
    });

    it('should throw StorageUnavailableError (503) when ms-storage is unreachable with connection failure', async () => {
      const updateDto = new UpdateUserCommandDTO();
      updateDto.avatarFileId = '123e4567-e89b-12d3-a456-426614174000';

      storageClientService.confirmUserAvatarAttachment.mockRejectedValue(
        STORAGE_ATTACHMENT_FAILED(mockAuthUser.id, '14 UNAVAILABLE: CONNECT ECONNREFUSED'),
      );

      const promise = controller.updateUser(updateDto, mockAuthUser);
      await expect(promise).rejects.toThrow(StorageUnavailableError);
      await expect(promise).rejects.toMatchObject({
        statusCode: 503,
        code: 'STORAGE_UNAVAILABLE',
        details: { entityId: mockAuthUser.id },
      });
      expect(userService.update).not.toHaveBeenCalled();
    });

    it('should rethrow StorageRelayedError when storage refuses attachment (erreur relayee)', async () => {
      const updateDto = new UpdateUserCommandDTO();
      updateDto.avatarFileId = '123e4567-e89b-12d3-a456-426614174000';

      const relayedError = new StorageRelayedError(
        {
          statusCode: 422,
          code: 'FILE_ATTACHMENT_REFUSED',
          message: 'Attachment refused: not confirmed',
          details: { reason: 'NOT_CONFIRMED' },
        },
        GrpcStatus.FAILED_PRECONDITION,
      );
      storageClientService.confirmUserAvatarAttachment.mockRejectedValue(relayedError);

      await expect(controller.updateUser(updateDto, mockAuthUser)).rejects.toThrow(
        StorageRelayedError,
      );
      expect(userService.update).not.toHaveBeenCalled();
    });

    it('should rethrow when file is not clean / rejected (fichier non propre)', async () => {
      const updateDto = new UpdateUserCommandDTO();
      updateDto.avatarFileId = '123e4567-e89b-12d3-a456-426614174000';

      const rejectedError = new StorageRelayedError(
        {
          statusCode: 422,
          code: 'FILE_ATTACHMENT_REFUSED',
          message: 'Attachment refused: content rejected',
          details: { reason: 'CONTENT_REJECTED' },
        },
        GrpcStatus.FAILED_PRECONDITION,
      );
      storageClientService.confirmUserAvatarAttachment.mockRejectedValue(rejectedError);

      await expect(controller.updateUser(updateDto, mockAuthUser)).rejects.toThrow(
        StorageRelayedError,
      );
      expect(userService.update).not.toHaveBeenCalled();
    });

    it('should rethrow when user is not the owner or file is not found (mauvais proprietaire)', async () => {
      const updateDto = new UpdateUserCommandDTO();
      updateDto.avatarFileId = '123e4567-e89b-12d3-a456-426614174000';

      const notFoundError = FILE_NOT_FOUND('123e4567-e89b-12d3-a456-426614174000');
      storageClientService.confirmUserAvatarAttachment.mockRejectedValue(notFoundError);

      await expect(controller.updateUser(updateDto, mockAuthUser)).rejects.toThrow(notFoundError);
      expect(userService.update).not.toHaveBeenCalled();
    });

    it('should succeed when identical avatar is replayed (avatar identique rejoue - idempotence)', async () => {
      const updateDto = new UpdateUserCommandDTO();
      updateDto.avatarFileId = '123e4567-e89b-12d3-a456-426614174000';

      const userWithAvatar = UserFactory.create({
        avatarFileId: '123e4567-e89b-12d3-a456-426614174000',
      });
      userService.update = jest.fn().mockResolvedValue(userWithAvatar);
      userTransformer.toUserDTO = jest.fn().mockReturnValue({
        id: mockAuthUser.id,
        avatarFileId: '123e4567-e89b-12d3-a456-426614174000',
      });

      const result = await controller.updateUser(updateDto, mockAuthUser);

      expect(storageClientService.confirmUserAvatarAttachment).toHaveBeenCalledWith(
        mockAuthUser.id,
        '123e4567-e89b-12d3-a456-426614174000',
        undefined,
      );
      expect(userService.update).toHaveBeenCalled();
      expect(result.user?.avatarFileId).toBe('123e4567-e89b-12d3-a456-426614174000');
    });
  });

  describe('deleteUser with authentication', () => {
    it('should request user deletion with JWT token', async () => {
      const deleteDto = new DeleteUserCommandDTO();

      await controller.deleteUser(deleteDto, mockAuthUser);

      expect(userService.requestDeletion).toHaveBeenCalledWith(
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

      expect(userService.requestDeletion).toHaveBeenCalledWith(
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
      userService.requestDeletion = jest.fn().mockRejectedValue(mockError);

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

      userService.requestDeletion = jest.fn().mockRejectedValue(mockApiError);

      const deleteDto = new DeleteUserCommandDTO();

      await expect(controller.deleteUser(deleteDto, mockAuthUser)).rejects.toThrow('Not found');

      expect(createSpy).not.toHaveBeenCalled();
    });
  });
});
