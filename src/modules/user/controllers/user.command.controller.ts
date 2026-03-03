import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import {
  USER_SERVICE_NAME,
  type CreateUserCommand,
  type CreateUserResponse,
  type UpdateUserCommand,
  type UpdateUserResponse,
  type DeleteUserCommand,
  type DeleteUserResponse,
} from '@volontariapp/contracts';

@Controller()
export class UserCommandController {
  @GrpcMethod(USER_SERVICE_NAME, 'createUser')
  async createUser(_command: CreateUserCommand): Promise<CreateUserResponse> {
    throw new Error('Method not implemented.');
  }

  @GrpcMethod(USER_SERVICE_NAME, 'updateUser')
  async updateUser(_command: UpdateUserCommand): Promise<UpdateUserResponse> {
    throw new Error('Method not implemented.');
  }

  @GrpcMethod(USER_SERVICE_NAME, 'deleteUser')
  async deleteUser(_command: DeleteUserCommand): Promise<DeleteUserResponse> {
    throw new Error('Method not implemented.');
  }
}
