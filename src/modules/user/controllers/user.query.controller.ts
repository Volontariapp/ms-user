import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import {
  type UserQuery,
  type GetUserResponse,
  type ListUsersQuery,
  type ListUsersResponse,
} from '@volontariapp/contracts';
import { USER_SERVICE_NAME, USER_METHODS } from '@volontariapp/contracts-nest';

@Controller()
export class UserQueryController {
  @GrpcMethod(USER_SERVICE_NAME, USER_METHODS.GET_USER)
  getUser(_query: UserQuery): Promise<GetUserResponse> {
    throw new Error('Method not implemented.');
  }

  @GrpcMethod(USER_SERVICE_NAME, USER_METHODS.LIST_USERS)
  listUsers(_query: ListUsersQuery): Promise<ListUsersResponse> {
    throw new Error('Method not implemented.');
  }
}
