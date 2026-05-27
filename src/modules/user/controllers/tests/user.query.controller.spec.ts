import { Test, TestingModule } from '@nestjs/testing';
import { UserQueryController } from '../queries/user.query.controller';
import { UserService } from '@volontariapp/domain-user';
import { UserTransformer } from '../../transformers/user.transformer';
import { GetUserQueryDTO } from '../../dto/request/query/get-user.query.dto';
import { AdminGetUserQueryDTO } from '../../dto/request/query/admin-get-user.query.dto';
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
  });
});
