import { Module } from '@nestjs/common';
import { UserCommandController } from './controllers/user.command.controller.js';
import { UserQueryController } from './controllers/user.query.controller.js';
import { UserTestController } from './controllers/user.test.controller.js';
import { BadgeCommandController } from './controllers/badge.command.controller.js';
import { BadgeQueryController } from './controllers/badge.query.controller.js';

@Module({
  controllers: [
    UserCommandController,
    UserQueryController,
    UserTestController,
    BadgeCommandController,
    BadgeQueryController,
  ],
})
export class UserModule {}
