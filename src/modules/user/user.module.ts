import { Module } from '@nestjs/common';
import { DomainUserModule } from '@volontariapp/domain-user';
import { UserCommandController } from './controllers/user.command.controller.js';
import { UserQueryController } from './controllers/user.query.controller.js';
import { UserTestController } from './controllers/user.test.controller.js';
import { BadgeCommandController } from './controllers/badge.command.controller.js';
import { BadgeQueryController } from './controllers/badge.query.controller.js';
import { UserTransformer } from './transformers/user.transformer.js';
import { BadgeTransformer } from './transformers/badge.transformer.js';
import { AppConfigService } from '../../config/app-config.service.js';

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
  providers: [UserTransformer, BadgeTransformer],
})
export class UserModule {}
