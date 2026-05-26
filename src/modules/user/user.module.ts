import { Module } from '@nestjs/common';
import { DomainUserModule } from '@volontariapp/domain-user';
import { UserCommandController } from './controllers/command/user.command.controller.js';
import { UserQueryController } from './controllers/queries/user.query.controller.js';
import { UserTestController } from './controllers/tests/user.test.controller.js';
import { BadgeCommandController } from './controllers/command/badge.command.controller.js';
import { BadgeQueryController } from './controllers/queries/badge.query.controller.js';
import { UserTransformer } from './transformers/user.transformer.js';
import { BadgeTransformer } from './transformers/badge.transformer.js';
import { AppConfigService } from '../../config/app-config.service.js';
import { SocialRelationshipQueryClientService } from './clients/social-relationship.query-client.js';

@Module({
  imports: [
    DomainUserModule.registerAsync({
      useFactory: (configService: AppConfigService) => ({
        emailEncryptionSecret: configService.emailEncryptionSecret,
        auth: configService.config.auth,
      }),
      inject: [AppConfigService],
    }),
  ],
  controllers: [
    UserCommandController,
    UserQueryController,
    UserTestController,
    BadgeCommandController,
    BadgeQueryController,
  ],
  providers: [UserTransformer, BadgeTransformer, SocialRelationshipQueryClientService],
})
export class UserModule {}
