import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import {
  type GetUserQuery,
  type UserResponse,
  type ListUsersQuery,
  type ListUsersResponse,
} from '@volontariapp/contracts';
import { USER_SERVICE_NAME, USER_QUERY_METHODS } from '@volontariapp/contracts-nest';

@Controller()
export class UserQueryController {
  @GrpcMethod(USER_SERVICE_NAME, USER_QUERY_METHODS.GET_USER)
  getUser(_query: GetUserQuery): Promise<UserResponse> {
    throw new Error('Method not implemented.');
  }

  @GrpcMethod(USER_SERVICE_NAME, USER_QUERY_METHODS.LIST_USERS)
  listUsers(_query: ListUsersQuery): Promise<ListUsersResponse> {
    throw new Error('Method not implemented.');
  }
}
