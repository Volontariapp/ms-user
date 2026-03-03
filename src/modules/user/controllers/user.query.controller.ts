import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import {
  USER_SERVICE_NAME,
  USER_GRPC_METHODS,
  type UserQuery,
  type GetUserResponse,
  type ListUsersQuery,
  type ListUsersResponse,
} from '@volontariapp/contracts';

@Controller()
export class UserQueryController {
  @GrpcMethod(USER_SERVICE_NAME, USER_GRPC_METHODS.GET_USER)
  async getUser(_query: UserQuery): Promise<GetUserResponse> {
    throw new Error('Method not implemented.');
  }

  @GrpcMethod(USER_SERVICE_NAME, USER_GRPC_METHODS.LIST_USERS)
  async listUsers(_query: ListUsersQuery): Promise<ListUsersResponse> {
    throw new Error('Method not implemented.');
  }
}
