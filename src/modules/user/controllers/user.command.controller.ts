import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import {
  USER_SERVICE_NAME,
  USER_GRPC_METHODS,
  type CreateUserCommand,
  type CreateUserResponse,
  type UpdateUserCommand,
  type UpdateUserResponse,
  type DeleteUserCommand,
  type DeleteUserResponse,
} from '@volontariapp/contracts';

@Controller()
export class UserCommandController {
  @GrpcMethod(USER_SERVICE_NAME, USER_GRPC_METHODS.CREATE_USER)
  createUser(_command: CreateUserCommand): Promise<CreateUserResponse> {
    throw new Error('Method not implemented.');
  }

  @GrpcMethod(USER_SERVICE_NAME, USER_GRPC_METHODS.UPDATE_USER)
  updateUser(_command: UpdateUserCommand): Promise<UpdateUserResponse> {
    throw new Error('Method not implemented.');
  }

  @GrpcMethod(USER_SERVICE_NAME, USER_GRPC_METHODS.DELETE_USER)
  deleteUser(_command: DeleteUserCommand): Promise<DeleteUserResponse> {
    throw new Error('Method not implemented.');
  }
}
