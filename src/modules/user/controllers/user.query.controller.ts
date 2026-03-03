import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import {
  USER_SERVICE_NAME,
  type UserQuery,
  type GetUserResponse,
  type ListUsersQuery,
  type ListUsersResponse,
} from '@volontariapp/contracts';

@Controller()
export class UserQueryController {
  @GrpcMethod(USER_SERVICE_NAME, 'getUser')
  async getUser(_query: UserQuery): Promise<GetUserResponse> {
    throw new Error('Method not implemented.');
  }

  @GrpcMethod(USER_SERVICE_NAME, 'listUsers')
  async listUsers(_query: ListUsersQuery): Promise<ListUsersResponse> {
    throw new Error('Method not implemented.');
  }
}
