import { Controller, UseGuards } from '@nestjs/common';
import { GrpcMethod, Payload } from '@nestjs/microservices';
import { GrpcInternalGuard, CurrentUser, InternalToken } from '@volontariapp/auth';
import type { AuthUser } from '@volontariapp/auth';
import { USER_SERVICE_NAME, USER_QUERY_METHODS } from '@volontariapp/contracts-nest';
import { GetEventParticipantsProfilesQueryDTO } from '../../dto/request/query/get-event-participants-profiles.query.dto.js';
import { GetPostLikersProfilesQueryDTO } from '../../dto/request/query/get-post-likers-profiles.query.dto.js';
import { GetUserQueryDTO } from '../../dto/request/query/get-user.query.dto.js';
import { UserResponseDTO } from '../../dto/response/user.response.dto.js';
import { Logger } from '@volontariapp/logger';
import { UserTransformer } from '../../transformers/user.transformer.js';
import { USER_NOT_FOUND } from '@volontariapp/errors-nest';
import { UserId, UserService, PaginationInput, UserStatus } from '@volontariapp/domain-user';
import { ListUsersQueryDTO } from '../../dto/request/query/list-users.query.dto.js';
import { ListUsersResponseDTO } from '../../dto/response/list-users.response.dto.js';
import { AdminGetUserQueryDTO } from '../../dto/request/query/admin-get-user.query.dto.js';
import { AdminUserResponseDTO } from '../../dto/response/admin-user.response.dto.js';
import { SocialRelationshipQueryClientService } from '../../clients/social-relationship.query-client.js';
import { GetMyFollowsProfilesQueryDTO } from '../../dto/request/query/get-my-follows-profiles.query.dto.js';
import { GetMyFollowersProfilesQueryDTO } from '../../dto/request/query/get-my-followers-profiles.query.dto.js';
import { GetUsersByIdsQueryDTO } from '../../dto/request/query/get-users-by-ids.query.dto.js';
import { GetUsersByIdsResponseDTO } from '../../dto/response/get-users-by-ids.response.dto.js';

import { SocialParticipationQueryClientService } from '../../clients/social-participation.query-client.js';
import { SocialInteractionQueryClientService } from '../../clients/social-interaction.query-client.js';
import { findActiveUsersInOrder } from '../../helpers/find-active-users-in-order.js';
import { PublicUserResponseDto } from '../../dto/response/public.user.response.dto.js';

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 10;

@Controller()
export class UserQueryController {
  private readonly logger = new Logger({ context: UserQueryController.name });

  constructor(
    private readonly userService: UserService,
    private readonly userTransformer: UserTransformer,
    private readonly socialRelationshipQueryClient: SocialRelationshipQueryClientService,
    private readonly socialParticipationClient: SocialParticipationQueryClientService,
    private readonly socialInteractionClient: SocialInteractionQueryClientService,
  ) {}

  @UseGuards(GrpcInternalGuard)
  @GrpcMethod(USER_SERVICE_NAME, USER_QUERY_METHODS.GET_USER)
  async getUser(
    @Payload() _data: GetUserQueryDTO,
    @CurrentUser() user: AuthUser,
  ): Promise<UserResponseDTO> {
    this.logger.debug('gRPC: Getting user with id: ' + user.id);
    const userEntity = await this.userService.findById(new UserId(user.id));
    if (userEntity.status === UserStatus.PENDING_DELETION) {
      throw USER_NOT_FOUND(user.id);
    }
    return { user: this.userTransformer.toUserDTO(userEntity) };
  }

  @UseGuards(GrpcInternalGuard)
  @GrpcMethod(USER_SERVICE_NAME, 'GetUsersByIds')
  async getUsersByIds(@Payload() data: GetUsersByIdsQueryDTO): Promise<GetUsersByIdsResponseDTO> {
    this.logger.debug(`gRPC: Getting users by ids: ${String(data.ids.length)}`);
    const validUsers = await findActiveUsersInOrder(this.userService, data.ids);

    return {
      users: validUsers.map((u) => this.userTransformer.toUserDTO(u)),
      pagination: {
        total: validUsers.length,
        page: 1,
        limit: validUsers.length,
        totalPages: 1,
      },
    };
  }

  @GrpcMethod(USER_SERVICE_NAME, USER_QUERY_METHODS.LIST_USERS)
  async listUsers(@Payload() data: ListUsersQueryDTO): Promise<ListUsersResponseDTO> {
    this.logger.debug('gRPC: Listing all users');
    const page = data.pagination?.page ?? DEFAULT_PAGE;
    const limit = data.pagination?.limit ?? DEFAULT_LIMIT;
    const pagination = new PaginationInput(limit, (page - 1) * limit);
    const result = await this.userService.findPage(pagination, [UserStatus.PENDING_DELETION]);
    return {
      users: result.users.map((user) => this.userTransformer.toUserDTO(user)),
      pagination: {
        total: result.total,
        page,
        limit,
        totalPages: limit > 0 ? Math.ceil(result.total / limit) : 1,
      },
    };
  }

  @UseGuards(GrpcInternalGuard)
  @GrpcMethod(USER_SERVICE_NAME, 'AdminGetUser')
  async adminGetUser(@Payload() data: AdminGetUserQueryDTO): Promise<AdminUserResponseDTO> {
    this.logger.log(`gRPC: Admin getting user with id: ${data.userId}`);
    const user = await this.userService.findById(new UserId(data.userId));
    if (user.status === UserStatus.PENDING_DELETION) {
      throw USER_NOT_FOUND(data.userId);
    }
    return { user: this.userTransformer.toUserDTO(user) };
  }

  @UseGuards(GrpcInternalGuard)
  @GrpcMethod(USER_SERVICE_NAME, 'GetPublicUser')
  async getPublicUser(@Payload() data: AdminGetUserQueryDTO): Promise<PublicUserResponseDto> {
    this.logger.debug(`gRPC: Getting public user profile with id: ${data.userId}`);
    const user = await this.userService.findById(new UserId(data.userId));
    if (user.status === UserStatus.PENDING_DELETION) {
      throw USER_NOT_FOUND(data.userId);
    }
    return { userPublic: this.userTransformer.toPublicUserDTO(user) };
  }

  @UseGuards(GrpcInternalGuard)
  @GrpcMethod(USER_SERVICE_NAME, 'GetMyFollowsProfiles')
  async getMyFollowsProfiles(
    @Payload() data: GetMyFollowsProfilesQueryDTO,
    @CurrentUser() user: AuthUser,
    @InternalToken() token: string,
  ): Promise<ListUsersResponseDTO> {
    /**
     * Il faut implementer le cas asynchrone, si on failed alors on renvoie une 206, et on cree un event
     */
    this.logger.debug(`gRPC: Getting follows profiles for user: ${user.id}`);
    const page = data.pagination?.page ?? 1;
    const limit = data.pagination?.limit ?? 10;

    const { ids, totalCount } = await this.socialRelationshipQueryClient.getMyFollows(
      token,
      limit,
      page,
    );

    const validUsers = await findActiveUsersInOrder(this.userService, ids);

    return {
      users: validUsers.map((u) => this.userTransformer.toUserDTO(u)),
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
    };
  }

  @UseGuards(GrpcInternalGuard)
  @GrpcMethod(USER_SERVICE_NAME, 'GetMyFollowersProfiles')
  async getMyFollowersProfiles(
    @Payload() data: GetMyFollowersProfilesQueryDTO,
    @CurrentUser() user: AuthUser,
    @InternalToken() token: string,
  ): Promise<ListUsersResponseDTO> {
    this.logger.debug(`gRPC: Getting followers profiles for user: ${user.id}`);
    const page = data.pagination?.page ?? 1;
    const limit = data.pagination?.limit ?? 10;

    const { ids, totalCount } = await this.socialRelationshipQueryClient.getMyFollowers(
      token,
      limit,
      page,
    );

    const validUsers = await findActiveUsersInOrder(this.userService, ids);

    return {
      users: validUsers.map((u) => this.userTransformer.toUserDTO(u)),
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
    };
  }

  @UseGuards(GrpcInternalGuard)
  @GrpcMethod(USER_SERVICE_NAME, 'GetEventParticipantsProfiles')
  async getEventParticipantsProfiles(
    @Payload() data: GetEventParticipantsProfilesQueryDTO,
    @CurrentUser() user: AuthUser,
    @InternalToken() token: string,
  ): Promise<ListUsersResponseDTO> {
    this.logger.debug(
      `gRPC: Getting event participants profiles for event: ${data.eventId} by user ${user.id}`,
    );
    const page = data.pagination?.page ?? 1;
    const limit = data.pagination?.limit ?? 10;

    const { ids, totalCount } = await this.socialParticipationClient.getEventParticipants(
      token,
      data.eventId,
      limit,
      page,
    );

    const validUsers = await findActiveUsersInOrder(this.userService, ids);

    return {
      users: validUsers.map((u) => this.userTransformer.toUserDTO(u)),
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
    };
  }

  @UseGuards(GrpcInternalGuard)
  @GrpcMethod(USER_SERVICE_NAME, 'GetPostLikersProfiles')
  async getPostLikersProfiles(
    @Payload() data: GetPostLikersProfilesQueryDTO,
    @CurrentUser() user: AuthUser,
    @InternalToken() token: string,
  ): Promise<ListUsersResponseDTO> {
    this.logger.debug(
      `gRPC: Getting post likers profiles for post: ${data.postId} by user ${user.id}`,
    );
    const page = data.pagination?.page ?? 1;
    const limit = data.pagination?.limit ?? 10;

    const { ids, totalCount } = await this.socialInteractionClient.getPostLikers(
      token,
      data.postId,
      limit,
      page,
    );

    const validUsers = await findActiveUsersInOrder(this.userService, ids);

    return {
      users: validUsers.map((u) => this.userTransformer.toUserDTO(u)),
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
    };
  }
}
