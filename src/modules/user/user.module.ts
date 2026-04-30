import { Module } from '@nestjs/common';
import {
  AuthService,
  BadgeService,
  EMAIL_ENCRYPTION_SECRET,
  PostgresBadgeRepository,
  PostgresUserRepository,
  UserService,
} from '@volontariapp/domain-user';
import { AUTH_OPTIONS, JwtService, type AuthConfig } from '@volontariapp/auth';
import { UserCommandController } from './controllers/user.command.controller.js';
import { UserQueryController } from './controllers/user.query.controller.js';
import { UserTestController } from './controllers/user.test.controller.js';
import { BadgeCommandController } from './controllers/badge.command.controller.js';
import { BadgeQueryController } from './controllers/badge.query.controller.js';
import { UserTransformer } from './transformers/user.transformer.js';
import { BadgeTransformer } from './transformers/badge.transformer.js';
import { AppConfigService } from '../../config/app-config.service.js';

@Module({
  controllers: [
    UserCommandController,
    UserQueryController,
    UserTestController,
    BadgeCommandController,
    BadgeQueryController,
  ],
  providers: [
    {
      provide: AUTH_OPTIONS,
      useFactory: (configService: AppConfigService): AuthConfig =>
        configService.config.auth,
      inject: [AppConfigService],
    },
    {
      provide: JwtService,
      useFactory: (opts: AuthConfig) => new JwtService(opts),
      inject: [AUTH_OPTIONS],
    },
    {
      provide: EMAIL_ENCRYPTION_SECRET,
      useFactory: (configService: AppConfigService): string =>
        configService.emailEncryptionSecret,
      inject: [AppConfigService],
    },
    UserService,
    AuthService,
    BadgeService,
    PostgresUserRepository,
    PostgresBadgeRepository,
    UserTransformer,
    BadgeTransformer,
  ],
})
export class UserModule {}
