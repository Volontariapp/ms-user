import { Controller } from '@nestjs/common';
import {
  UserServiceController,
  UserServiceControllerMethods,
  CreateUserRequest,
  CreateUserResponse,
  GetUserRequest,
  GetUserResponse,
  UpdateUserRequest,
  UpdateUserResponse,
  DeleteUserRequest,
  DeleteUserResponse,
  ListUsersRequest,
  ListUsersResponse,
} from '@volontariapp/contracts';

@Controller()
@UserServiceControllerMethods()
export class UserGrpcController implements UserServiceController {
  async getUser(_request: GetUserRequest): Promise<GetUserResponse> {
    throw new Error('Method not implemented.');
  }

  async listUsers(_request: ListUsersRequest): Promise<ListUsersResponse> {
    throw new Error('Method not implemented.');
  }

  async createUser(_request: CreateUserRequest): Promise<CreateUserResponse> {
    throw new Error('Method not implemented.');
  }

  async updateUser(_request: UpdateUserRequest): Promise<UpdateUserResponse> {
    throw new Error('Method not implemented.');
  }

  async deleteUser(_request: DeleteUserRequest): Promise<DeleteUserResponse> {
    throw new Error('Method not implemented.');
  }
}
