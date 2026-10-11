import { Test, TestingModule } from '@nestjs/testing';
import { UserQueryController } from '../queries/user.query.controller';
import { UserService, UserStatus } from '@volontariapp/domain-user';
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

describe('UserQueryController', () => {
  let controller: UserQueryController;
  let userService: Partial<UserService>;
  let userTransformer: Partial<UserTransformer>;

  const mockAuthUser: AuthUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    role: 'VOLUNTEER',
  };

  const mockUser = UserFactory.create();

  beforeEach(async () => {
    userService = {
      findById: jest.fn().mockResolvedValue(mockUser),
      findAll: jest.fn(),
    };

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
        { provide: SocialRelationshipQueryClientService, useValue: {} },
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
      userService.findById = jest.fn().mockResolvedValue(pendingDeletionUser);
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
      userService.findById = jest.fn().mockResolvedValue(pendingDeletionUser);
      const adminQuery = new AdminGetUserQueryDTO();
      adminQuery.userId = 'other-user-id';

      await expect(controller.adminGetUser(adminQuery)).rejects.toThrow();
    });
  });

  describe('getPublicUser', () => {
    it('should throw USER_NOT_FOUND when user is PENDING_DELETION', async () => {
      const pendingDeletionUser = UserFactory.create({ status: UserStatus.PENDING_DELETION });
      userService.findById = jest.fn().mockResolvedValue(pendingDeletionUser);
      const query = new AdminGetUserQueryDTO();
      query.userId = 'public-user-id';

      await expect(controller.getPublicUser(query)).rejects.toThrow();
    });
  });

  describe('getUsersByIds', () => {
    it('should filter out users with PENDING_DELETION status', async () => {
      const activeUser = UserFactory.create({ id: 'active-1' });
      const pendingUser = UserFactory.create({
        id: 'pending-2',
        status: UserStatus.PENDING_DELETION,
      });
      userService.findById = jest.fn().mockImplementation((userId: { value: string }) => {
        if (userId.value === 'active-1') {
          return Promise.resolve(activeUser);
        }
        return Promise.resolve(pendingUser);
      });

      const query = new GetUsersByIdsQueryDTO();
      query.ids = ['active-1', 'pending-2'];

      const result = await controller.getUsersByIds(query);

      expect(result.users).toHaveLength(1);
    });
  });
});
