import { Controller, UseGuards } from '@nestjs/common';
import { GrpcMethod, Payload } from '@nestjs/microservices';
import { GrpcInternalGuard, CurrentUser } from '@volontariapp/auth';
import type { AuthUser } from '@volontariapp/auth';
import { USER_SERVICE_NAME, USER_COMMAND_METHODS } from '@volontariapp/contracts-nest';
import {
  AuthService,
  BadgeId,
  ImpactScore,
  LoginInput,
  RefreshTokensInput,
  UserId,
  UserService,
} from '@volontariapp/domain-user';
import { UserTransformer } from '../../transformers/user.transformer.js';
import { UserJobType } from '@volontariapp/messaging';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BaseCommandController } from './base.command.controller.js';
import { SignUpCommandDTO } from '../../dto/request/command/sign-up.command.dto.js';
import { SignUpResponseDTO } from '../../dto/response/sign-up.response.dto.js';
import { LoginCommandDTO } from '../../dto/request/command/login.command.dto.js';
import { LoginResponseDTO } from '../../dto/response/login.response.dto.js';
import { UpdateUserCommandDTO } from '../../dto/request/command/update-user.command.dto.js';
import { UpdateUserResponseDTO } from '../../dto/response/update-user.response.dto.js';
import { DeleteUserCommandDTO } from '../../dto/request/command/delete-user.command.dto.js';
import { RefreshTokenCommandDTO } from '../../dto/request/command/refresh-token.command.dto.js';
import { AddBadgeToUserCommandDTO } from '../../dto/request/command/add-badge-to-user.command.dto.js';
import { RemoveBadgeFromUserCommandDTO } from '../../dto/request/command/remove-badge-from-user.command.dto.js';
import { IncrementImpactScoreCommandDTO } from '../../dto/request/command/increment-impact-score.command.dto.js';
import { AdminUpdateUserCommandDTO } from '../../dto/request/command/admin-update-user.command.dto.js';
import { AdminUpdateUserResponseDTO } from '../../dto/response/admin-update-user.response.dto.js';
import { AdminDeleteUserCommandDTO } from '../../dto/request/command/admin-delete-user.command.dto.js';
import { AdminDeleteUserResponseDTO } from '../../dto/response/admin-delete-user.response.dto.js';

@Controller()
export class UserCommandController extends BaseCommandController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly userTransformer: UserTransformer,
    @InjectDataSource() dataSource: DataSource,
  ) {
    super(dataSource);
  }

  @GrpcMethod(USER_SERVICE_NAME, USER_COMMAND_METHODS.SIGN_UP)
  async signUp(@Payload() data: SignUpCommandDTO): Promise<SignUpResponseDTO> {
    this.logger.log('gRPC: Signing up user with email: ' + data.email);
    const signUpInput = this.userTransformer.toSignUpInput(data);
    const response = await this.authService.signUp(signUpInput);
    return {
      user: this.userTransformer.toUserDTO(response.user),
      auth: response.auth,
    };
  }

  @GrpcMethod(USER_SERVICE_NAME, USER_COMMAND_METHODS.LOGIN)
  async login(@Payload() data: LoginCommandDTO): Promise<LoginResponseDTO> {
    this.logger.log('gRPC: Logging in user with email: ' + data.email);
    const tokens = await this.authService.logIn(new LoginInput(data.email, data.password));
    return { auth: tokens };
  }

  @UseGuards(GrpcInternalGuard)
  @GrpcMethod(USER_SERVICE_NAME, USER_COMMAND_METHODS.UPDATE_USER)
  async updateUser(
    @Payload() data: UpdateUserCommandDTO,
    @CurrentUser() user: AuthUser,
  ): Promise<UpdateUserResponseDTO> {
    return this.withFallback(UserJobType.FALLBACK_UPDATE_USER, user.id, data, async () => {
      this.logger.log('gRPC: Updating user with id: ' + user.id);
      const input = this.userTransformer.toUpdateUserInput(data);
      const entity = await this.userService.update(new UserId(user.id), input);
      return {
        user: this.userTransformer.toUserDTO(entity),
      };
    });
  }

  @UseGuards(GrpcInternalGuard)
  @GrpcMethod(USER_SERVICE_NAME, USER_COMMAND_METHODS.DELETE_USER)
  async deleteUser(
    @Payload() _data: DeleteUserCommandDTO,
    @CurrentUser() user: AuthUser,
  ): Promise<void> {
    return this.withFallback(UserJobType.FALLBACK_DELETE_USER, user.id, _data, async () => {
      this.logger.log('gRPC: Deleting user with id: ' + user.id);
      await this.userService.delete(new UserId(user.id));
    });
  }

  @GrpcMethod(USER_SERVICE_NAME, USER_COMMAND_METHODS.REFRESH_TOKEN)
  async refreshTokens(@Payload() data: RefreshTokenCommandDTO): Promise<LoginResponseDTO> {
    this.logger.log('gRPC: Refreshing tokens');
    const tokens = await this.authService.refreshTokens(new RefreshTokensInput(data.refreshToken));
    return { auth: tokens };
  }

  @GrpcMethod(USER_SERVICE_NAME, USER_COMMAND_METHODS.ADD_BADGE_TO_USER)
  async addBadge(@Payload() data: AddBadgeToUserCommandDTO): Promise<void> {
    return this.withFallback(
      UserJobType.FALLBACK_ADD_BADGE_TO_USER,
      data.userId,
      data,
      async () => {
        this.logger.log(
          `gRPC: Adding badge with id: ${data.badgeId} to user with id: ${data.userId}`,
        );
        await this.userService.addBadgeToUser(new UserId(data.userId), new BadgeId(data.badgeId));
      },
    );
  }

  @GrpcMethod(USER_SERVICE_NAME, USER_COMMAND_METHODS.REMOVE_BADGE_FROM_USER)
  async removeBadge(@Payload() data: RemoveBadgeFromUserCommandDTO): Promise<void> {
    return this.withFallback(
      UserJobType.FALLBACK_REMOVE_BADGE_FROM_USER,
      data.userId,
      data,
      async () => {
        this.logger.log(
          `gRPC: Removing badge with id: ${data.badgeId} from user with id: ${data.userId}`,
        );
        await this.userService.removeBadgeFromUser(
          new UserId(data.userId),
          new BadgeId(data.badgeId),
        );
      },
    );
  }

  @GrpcMethod(USER_SERVICE_NAME, USER_COMMAND_METHODS.INCREMENT_IMPACT_SCORE)
  async incrementImpactScore(@Payload() data: IncrementImpactScoreCommandDTO): Promise<void> {
    return this.withFallback(
      UserJobType.FALLBACK_INCREMENT_IMPACT_SCORE,
      data.userId,
      data,
      async () => {
        this.logger.log(`gRPC: Incrementing impact score for user with id: ${data.userId}`);
        await this.userService.incrementImpactScore(
          new UserId(data.userId),
          new ImpactScore(data.scoreIncrement),
        );
      },
    );
  }

  @GrpcMethod(USER_SERVICE_NAME, 'AdminUpdateUser')
  async adminUpdateUser(
    @Payload() data: AdminUpdateUserCommandDTO,
  ): Promise<AdminUpdateUserResponseDTO> {
    this.logger.log(`gRPC: Admin updating user with id: ${data.userId}`);
    const input = this.userTransformer.toUpdateUserInput(data);
    await this.userService.update(new UserId(data.userId), input);
    return {};
  }

  @GrpcMethod(USER_SERVICE_NAME, 'AdminDeleteUser')
  async adminDeleteUser(
    @Payload() data: AdminDeleteUserCommandDTO,
  ): Promise<AdminDeleteUserResponseDTO> {
    this.logger.log(`gRPC: Admin deleting user with id: ${data.userId}`);
    await this.userService.delete(new UserId(data.userId));
    return {};
  }
}
