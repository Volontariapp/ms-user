import { Controller, UseGuards } from '@nestjs/common';
import { GrpcMethod, Payload } from '@nestjs/microservices';
import { GrpcInternalGuard, CurrentUser, InternalToken } from '@volontariapp/auth';
import type { AuthUser } from '@volontariapp/auth';
import { USER_SERVICE_NAME, USER_QUERY_METHODS } from '@volontariapp/contracts-nest';
import type {
  GetEventParticipantsProfilesQuery,
  GetPostLikersProfilesQuery,
} from '@volontariapp/contracts-nest';
import { GetUserQueryDTO } from '../../dto/request/query/get-user.query.dto.js';
import { UserResponseDTO } from '../../dto/response/user.response.dto.js';
import { Logger } from '@volontariapp/logger';
import { UserTransformer } from '../../transformers/user.transformer.js';
import { UserId, UserService, PaginationInput, UserEntity } from '@volontariapp/domain-user';
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
import { PublicUserResponseDto } from '../../dto/response/public.user.response.dto.js';

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
    this.logger.log('gRPC: Getting user with id: ' + user.id);
    const userEntity = await this.userService.findById(new UserId(user.id));
    return { user: this.userTransformer.toUserDTO(userEntity) };
  }

  @UseGuards(GrpcInternalGuard)
  @GrpcMethod(USER_SERVICE_NAME, 'GetUsersByIds')
  async getUsersByIds(@Payload() data: GetUsersByIdsQueryDTO): Promise<GetUsersByIdsResponseDTO> {
    this.logger.log(`gRPC: Getting users by ids: ${String(data.ids.length)}`);
    const users = await Promise.all(
      data.ids.map((id) => this.userService.findById(new UserId(id)).catch(() => null)),
    );
    const validUsers = users.filter((u): u is UserEntity => u !== null);

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
    this.logger.log('gRPC: Listing all users');
    const pagination = data.pagination
      ? new PaginationInput(
          data.pagination.limit,
          (data.pagination.page - 1) * data.pagination.limit,
        )
      : undefined;
    const result = await this.userService.findAll(pagination);
    const page = data.pagination?.page ?? 1;
    const limit = data.pagination?.limit ?? result.total;
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
    return { user: this.userTransformer.toUserDTO(user) };
  }

  @UseGuards(GrpcInternalGuard)
  @GrpcMethod(USER_SERVICE_NAME, 'GetPublicUser')
  async getPublicUser(@Payload() data: AdminGetUserQueryDTO): Promise<PublicUserResponseDto> {
    this.logger.log(`gRPC: Getting public user profile with id: ${data.userId}`);
    const user = await this.userService.findById(new UserId(data.userId));
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
    this.logger.log(`gRPC: Getting follows profiles for user: ${user.id}`);
    const page = data.pagination?.page ?? 1;
    const limit = data.pagination?.limit ?? 10;

    const { ids, totalCount } = await this.socialRelationshipQueryClient.getMyFollows(
      token,
      limit,
      page,
    );

    const users = await Promise.all(
      ids.map((id) => this.userService.findById(new UserId(id)).catch(() => null)),
    );
    const validUsers = users.filter((u): u is UserEntity => u !== null);

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
    this.logger.log(`gRPC: Getting followers profiles for user: ${user.id}`);
    const page = data.pagination?.page ?? 1;
    const limit = data.pagination?.limit ?? 10;

    const { ids, totalCount } = await this.socialRelationshipQueryClient.getMyFollowers(
      token,
      limit,
      page,
    );

    const users = await Promise.all(
      ids.map((id) => this.userService.findById(new UserId(id)).catch(() => null)),
    );
    const validUsers = users.filter((u): u is UserEntity => u !== null);

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
    @Payload() data: GetEventParticipantsProfilesQuery,
    @CurrentUser() user: AuthUser,
    @InternalToken() token: string,
  ): Promise<ListUsersResponseDTO> {
    this.logger.log(
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

    const users = await Promise.all(
      ids.map((id) => this.userService.findById(new UserId(id)).catch(() => null)),
    );
    const validUsers = users.filter((u): u is UserEntity => u !== null);

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
    @Payload() data: GetPostLikersProfilesQuery,
    @CurrentUser() user: AuthUser,
    @InternalToken() token: string,
  ): Promise<ListUsersResponseDTO> {
    this.logger.log(
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

    const users = await Promise.all(
      ids.map((id) => this.userService.findById(new UserId(id)).catch(() => null)),
    );
    const validUsers = users.filter((u): u is UserEntity => u !== null);

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
