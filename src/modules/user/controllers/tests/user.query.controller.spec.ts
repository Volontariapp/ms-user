import { Test, TestingModule } from '@nestjs/testing';
import { UserQueryController } from '../queries/user.query.controller';
import { UserListResult, UserService, UserStatus } from '@volontariapp/domain-user';
import { UserTransformer } from '../../transformers/user.transformer';
import { GetUserQueryDTO } from '../../dto/request/query/get-user.query.dto';
import { AdminGetUserQueryDTO } from '../../dto/request/query/admin-get-user.query.dto';
import { GetUsersByIdsQueryDTO } from '../../dto/request/query/get-users-by-ids.query.dto';
import { UserFactory } from '../../../../__test-utils__/factories/user.factory';
import type { AuthUser } from '@volontariapp/auth';
import { JwtService } from '@volontariapp/auth';
import { SocialRelationshipQueryClientService } from '../../clients/social-relationship.query-client';
import { SocialParticipationQueryClientService } from '../../clients/social-participation.query-client';
import { SocialInteractionQueryClientService } from '../../clients/social-interaction.query-client';
import { ListUsersQueryDTO } from '../../dto/request/query/list-users.query.dto';
import { GetMyFollowsProfilesQueryDTO } from '../../dto/request/query/get-my-follows-profiles.query.dto';
import { createUserServiceMock } from './user-service.mock';
import type { UserServiceMock } from './user-service.mock';
import { createSocialRelationshipClientMock } from './social-clients.mock';
import type { SocialRelationshipClientMock } from './social-clients.mock';

const ID_A = '11111111-1111-4111-8111-111111111111';
const ID_B = '22222222-2222-4222-8222-222222222222';
const ID_C = '33333333-3333-4333-8333-333333333333';
const ID_UNKNOWN = '99999999-9999-4999-8999-999999999999';

describe('UserQueryController', () => {
  let controller: UserQueryController;
  let userService: jest.Mocked<UserServiceMock>;
  let relationshipClient: jest.Mocked<SocialRelationshipClientMock>;
  let userTransformer: Partial<UserTransformer>;

  const mockAuthUser: AuthUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    role: 'VOLUNTEER',
  };

  const mockUser = UserFactory.create();

  beforeEach(async () => {
    userService = createUserServiceMock();
    userService.findById.mockResolvedValue(mockUser);
    relationshipClient = createSocialRelationshipClientMock();

    userTransformer = {
      toUserDTO: jest.fn().mockReturnValue({
        id: mockUser.id,
        email: mockUser.email,
        pseudo: mockUser.pseudo,
      }),
      toPublicUserDTO: jest.fn().mockReturnValue({
        id: mockUser.id,
        pseudo: mockUser.pseudo,
        bio: mockUser.bio,
        totalImpactScore: mockUser.totalImpactScore,
        badges: mockUser.badges,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserQueryController],
      providers: [
        { provide: UserService, useValue: userService },
        { provide: UserTransformer, useValue: userTransformer },
        { provide: JwtService, useValue: { verifyInternal: jest.fn() } },
        { provide: SocialRelationshipQueryClientService, useValue: relationshipClient },
        { provide: SocialParticipationQueryClientService, useValue: {} },
        { provide: SocialInteractionQueryClientService, useValue: {} },
      ],
    }).compile();

    controller = module.get<UserQueryController>(UserQueryController);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getUser with authentication', () => {
    it('should retrieve current user profile with JWT token', async () => {
      const query = new GetUserQueryDTO();

      const result = await controller.getUser(query, mockAuthUser);

      expect(userService.findById).toHaveBeenCalledWith(
        expect.objectContaining({ value: mockAuthUser.id }),
      );
      expect(result).toEqual({
        user: {
          id: mockUser.id,
          email: mockUser.email,
          pseudo: mockUser.pseudo,
        },
      });
    });

    it('should use userId from JWT token, not from DTO', async () => {
      const query = new GetUserQueryDTO();

      await controller.getUser(query, mockAuthUser);

      expect(userService.findById).toHaveBeenCalledWith(
        expect.objectContaining({ value: mockAuthUser.id }),
      );
    });

    it('should throw USER_NOT_FOUND when user is PENDING_DELETION', async () => {
      const pendingDeletionUser = UserFactory.create({ status: UserStatus.PENDING_DELETION });
      userService.findById.mockResolvedValue(pendingDeletionUser);
      const query = new GetUserQueryDTO();

      await expect(controller.getUser(query, mockAuthUser)).rejects.toThrow();
    });
  });

  describe('adminGetUser', () => {
    it('should allow admin to retrieve any user by ID', async () => {
      const adminQuery = new AdminGetUserQueryDTO();
      adminQuery.userId = 'other-user-id';

      const result = await controller.adminGetUser(adminQuery);

      expect(userService.findById).toHaveBeenCalledWith(
        expect.objectContaining({ value: 'other-user-id' }),
      );
      expect(result).toEqual({
        user: {
          id: mockUser.id,
          email: mockUser.email,
          pseudo: mockUser.pseudo,
        },
      });
    });

    it('should throw USER_NOT_FOUND when user is PENDING_DELETION', async () => {
      const pendingDeletionUser = UserFactory.create({ status: UserStatus.PENDING_DELETION });
      userService.findById.mockResolvedValue(pendingDeletionUser);
      const adminQuery = new AdminGetUserQueryDTO();
      adminQuery.userId = 'other-user-id';

      await expect(controller.adminGetUser(adminQuery)).rejects.toThrow();
    });
  });

  describe('getPublicUser', () => {
    it('should throw USER_NOT_FOUND when user is PENDING_DELETION', async () => {
      const pendingDeletionUser = UserFactory.create({ status: UserStatus.PENDING_DELETION });
      userService.findById.mockResolvedValue(pendingDeletionUser);
      const query = new AdminGetUserQueryDTO();
      query.userId = 'public-user-id';

      await expect(controller.getPublicUser(query)).rejects.toThrow();
    });
  });

  describe('getUsersByIds', () => {
    it('doit filtrer les utilisateurs PENDING_DELETION', async () => {
      const activeUser = UserFactory.create({ id: ID_A });
      const pendingUser = UserFactory.create({ id: ID_B, status: UserStatus.PENDING_DELETION });
      userService.findByIds.mockResolvedValue([activeUser, pendingUser]);

      const query = new GetUsersByIdsQueryDTO();
      query.ids = [ID_A, ID_B];

      const result = await controller.getUsersByIds(query);

      expect(result.users).toHaveLength(1);
    });

    it('doit faire un seul appel findByIds, conserver l ordre et ignorer les inconnus', async () => {
      const userA = UserFactory.create({ id: ID_A });
      const userB = UserFactory.create({ id: ID_B });
      const userC = UserFactory.create({ id: ID_C });
      userService.findByIds.mockResolvedValue([userA, userB, userC]);
      const toDto = jest.spyOn(userTransformer, 'toUserDTO' as never);
      toDto.mockImplementation(((user: { id: string }) => ({ id: user.id })) as never);

      const query = new GetUsersByIdsQueryDTO();
      query.ids = [ID_C, ID_UNKNOWN, ID_A, ID_B];

      const result = await controller.getUsersByIds(query);

      expect(userService.findByIds).toHaveBeenCalledTimes(1);
      expect(userService.findById).not.toHaveBeenCalled();
      expect(result.users.map((u) => u.id)).toEqual([ID_C, ID_A, ID_B]);
      expect(result.pagination?.total).toBe(3);
    });

    it('doit ignorer un id malforme sans interroger la base avec lui', async () => {
      userService.findByIds.mockResolvedValue([UserFactory.create({ id: ID_A })]);
      const query = new GetUsersByIdsQueryDTO();
      query.ids = ['not-a-uuid', ID_A];

      const result = await controller.getUsersByIds(query);

      expect(userService.findByIds).toHaveBeenCalledWith([
        expect.objectContaining({ value: ID_A }),
      ]);
      expect(result.users).toHaveLength(1);
    });
  });

  describe('listUsers', () => {
    it('doit renvoyer le total exact et exclure PENDING_DELETION via findPage', async () => {
      const pageUsers = [UserFactory.create({ id: ID_A }), UserFactory.create({ id: ID_B })];
      userService.findPage.mockResolvedValue(new UserListResult(pageUsers, 25));

      const query = new ListUsersQueryDTO();
      query.pagination = { page: 2, limit: 10 };

      const result = await controller.listUsers(query);

      expect(userService.findPage).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 10, offset: 10 }),
        [UserStatus.PENDING_DELETION],
      );
      expect(userService.findAll).not.toHaveBeenCalled();
      expect(result.users).toHaveLength(2);
      expect(result.pagination).toEqual({ total: 25, page: 2, limit: 10, totalPages: 3 });
    });

    it('doit appliquer page 1 et limit 10 par defaut', async () => {
      userService.findPage.mockResolvedValue(new UserListResult([], 0));

      const result = await controller.listUsers(new ListUsersQueryDTO());

      expect(userService.findPage).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 10, offset: 0 }),
        [UserStatus.PENDING_DELETION],
      );
      expect(result.pagination).toEqual({ total: 0, page: 1, limit: 10, totalPages: 0 });
    });
  });

  describe('getMyFollowsProfiles', () => {
    it('doit conserver l ordre de ms-social et le total de ms-social', async () => {
      relationshipClient.getMyFollows.mockResolvedValue({
        ids: [ID_C, ID_A, ID_B],
        totalCount: 42,
      });
      userService.findByIds.mockResolvedValue([
        UserFactory.create({ id: ID_A }),
        UserFactory.create({ id: ID_B }),
        UserFactory.create({ id: ID_C, status: UserStatus.PENDING_DELETION }),
      ]);
      jest
        .spyOn(userTransformer, 'toUserDTO' as never)
        .mockImplementation(((user: { id: string }) => ({ id: user.id })) as never);

      const result = await controller.getMyFollowsProfiles(
        new GetMyFollowsProfilesQueryDTO(),
        mockAuthUser,
        'token',
      );

      expect(userService.findByIds).toHaveBeenCalledTimes(1);
      expect(result.users.map((u) => u.id)).toEqual([ID_A, ID_B]);
      expect(result.pagination?.total).toBe(42);
    });
  });
});
