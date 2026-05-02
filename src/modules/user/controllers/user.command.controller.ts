import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { USER_SERVICE_NAME, USER_COMMAND_METHODS } from '@volontariapp/contracts-nest';
import { Logger } from '@volontariapp/logger';
import {
  AuthService,
  BadgeId,
  ImpactScore,
  LoginInput,
  RefreshTokensInput,
  UserId,
  UserService,
} from '@volontariapp/domain-user';
import { UserTransformer } from '../transformers/user.transformer.js';
import { SignUpCommandDTO } from '../dto/request/command/sign-up.command.dto.js';
import { SignUpResponseDTO } from '../dto/response/sign-up.response.dto.js';
import { LoginCommandDTO } from '../dto/request/command/login.command.dto.js';
import { LoginResponseDTO } from '../dto/response/login.response.dto.js';
import { UpdateUserCommandDTO } from '../dto/request/command/update-user.command.dto.js';
import { UpdateUserResponseDTO } from '../dto/response/update-user.response.dto.js';
import { DeleteUserCommandDTO } from '../dto/request/command/delete-user.command.dto.js';
import { RefreshTokenCommandDTO } from '../dto/request/command/refresh-token.command.dto.js';
import { AddBadgeToUserCommandDTO } from '../dto/request/command/add-badge-to-user.command.dto.js';
import { RemoveBadgeFromUserCommandDTO } from '../dto/request/command/remove-badge-from-user.command.dto.js';
import { IncrementImpactScoreCommandDTO } from '../dto/request/command/increment-impact-score.command.dto.js';

@Controller()
export class UserCommandController {
  private readonly logger = new Logger({ context: UserCommandController.name });

  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly userTransformer: UserTransformer,
  ) {}

  @GrpcMethod(USER_SERVICE_NAME, USER_COMMAND_METHODS.SIGN_UP)
  async signUp(data: SignUpCommandDTO): Promise<SignUpResponseDTO> {
    this.logger.log('gRPC: Signing up user with email: ' + data.email);
    const signUpInput = this.userTransformer.toSignUpInput(data);
    const response = await this.authService.signUp(signUpInput);
    return {
      user: this.userTransformer.toUserDTO(response.user),
      auth: response.auth,
    };
  }

  @GrpcMethod(USER_SERVICE_NAME, USER_COMMAND_METHODS.LOGIN)
  async login(data: LoginCommandDTO): Promise<LoginResponseDTO> {
    this.logger.log('gRPC: Logging in user with email: ' + data.email);
    const tokens = await this.authService.logIn(new LoginInput(data.email, data.password));
    return { auth: tokens };
  }

  @GrpcMethod(USER_SERVICE_NAME, USER_COMMAND_METHODS.UPDATE_USER)
  async updateUser(data: UpdateUserCommandDTO): Promise<UpdateUserResponseDTO> {
    this.logger.log('gRPC: Updating user with id: ' + data.userId);
    const partial = this.userTransformer.fromUserDTO(data);
    const entity = await this.userService.update(new UserId(data.userId), partial);
    return {
      user: this.userTransformer.toUserDTO(entity),
    };
  }

  @GrpcMethod(USER_SERVICE_NAME, USER_COMMAND_METHODS.DELETE_USER)
  async deleteUser(data: DeleteUserCommandDTO): Promise<void> {
    this.logger.log('gRPC: Deleting user with id: ' + data.userId);
    await this.userService.delete(new UserId(data.userId));
  }

  @GrpcMethod(USER_SERVICE_NAME, USER_COMMAND_METHODS.REFRESH_TOKEN)
  async refreshTokens(data: RefreshTokenCommandDTO): Promise<LoginResponseDTO> {
    this.logger.log('gRPC: Refreshing tokens');
    const tokens = await this.authService.refreshTokens(new RefreshTokensInput(data.refreshToken));
    return { auth: tokens };
  }

  @GrpcMethod(USER_SERVICE_NAME, USER_COMMAND_METHODS.ADD_BADGE_TO_USER)
  async addBadge(data: AddBadgeToUserCommandDTO): Promise<void> {
    this.logger.log(`gRPC: Adding badge with id: ${data.badgeId} to user with id: ${data.userId}`);
    await this.userService.addBadgeToUser(new UserId(data.userId), new BadgeId(data.badgeId));
  }

  @GrpcMethod(USER_SERVICE_NAME, USER_COMMAND_METHODS.REMOVE_BADGE_FROM_USER)
  async removeBadge(data: RemoveBadgeFromUserCommandDTO): Promise<void> {
    this.logger.log(
      `gRPC: Removing badge with id: ${data.badgeId} from user with id: ${data.userId}`,
    );
    await this.userService.removeBadgeFromUser(new UserId(data.userId), new BadgeId(data.badgeId));
  }

  @GrpcMethod(USER_SERVICE_NAME, USER_COMMAND_METHODS.INCREMENT_IMPACT_SCORE)
  async incrementImpactScore(data: IncrementImpactScoreCommandDTO): Promise<void> {
    this.logger.log(`gRPC: Incrementing impact score for user with id: ${data.userId}`);
    await this.userService.incrementImpactScore(
      new UserId(data.userId),
      new ImpactScore(data.scoreIncrement),
    );
  }
}
