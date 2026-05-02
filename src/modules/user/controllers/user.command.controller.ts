import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import {
  type SignUpCommand,
  type SignUpResponse,
  type UpdateUserCommand,
  type UpdateUserResponse,
  type DeleteUserCommand,
  type DeleteUserResponse,
} from '@volontariapp/contracts';
import { USER_SERVICE_NAME, USER_COMMAND_METHODS } from '@volontariapp/contracts-nest';

@Controller()
export class UserCommandController {
  @GrpcMethod(USER_SERVICE_NAME, USER_COMMAND_METHODS.SIGN_UP)
  signUp(_command: SignUpCommand): Promise<SignUpResponse> {
    throw new Error('Method not implemented.');
  }

  @GrpcMethod(USER_SERVICE_NAME, USER_COMMAND_METHODS.UPDATE_USER)
  updateUser(_command: UpdateUserCommand): Promise<UpdateUserResponse> {
    throw new Error('Method not implemented.');
  }

  @GrpcMethod(USER_SERVICE_NAME, USER_COMMAND_METHODS.DELETE_USER)
  deleteUser(_command: DeleteUserCommand): Promise<DeleteUserResponse> {
    throw new Error('Method not implemented.');
  }
}
