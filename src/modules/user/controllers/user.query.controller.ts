import { Controller, UseGuards } from '@nestjs/common';
import { GrpcMethod, Payload } from '@nestjs/microservices';
import { GrpcInternalGuard, CurrentUser } from '@volontariapp/auth';
import type { AuthUser } from '@volontariapp/auth';
import { USER_SERVICE_NAME, USER_QUERY_METHODS } from '@volontariapp/contracts-nest';
import { GetUserQueryDTO } from '../dto/request/query/get-user.query.dto.js';
import { UserResponseDTO } from '../dto/response/user.response.dto.js';
import { Logger } from '@volontariapp/logger';
import { UserTransformer } from '../transformers/user.transformer.js';
import { UserId, UserService, PaginationInput } from '@volontariapp/domain-user';
import { ListUsersQueryDTO } from '../dto/request/query/list-users.query.dto.js';
import { ListUsersResponseDTO } from '../dto/response/list-users.response.dto.js';
import { AdminGetUserQueryDTO } from '../dto/request/query/admin-get-user.query.dto.js';
import { AdminUserResponseDTO } from '../dto/response/admin-user.response.dto.js';

@Controller()
export class UserQueryController {
  private readonly logger = new Logger({ context: UserQueryController.name });

  constructor(
    private readonly userService: UserService,
    private readonly userTransformer: UserTransformer,
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

  @GrpcMethod(USER_SERVICE_NAME, 'AdminGetUser')
  async adminGetUser(@Payload() data: AdminGetUserQueryDTO): Promise<AdminUserResponseDTO> {
    this.logger.log(`gRPC: Admin getting user with id: ${data.userId}`);
    const user = await this.userService.findById(new UserId(data.userId));
    return { user: this.userTransformer.toUserDTO(user) };
  }
}
