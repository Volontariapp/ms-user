import { Module } from '@nestjs/common';
import { UserCommandController } from './controllers/user.command.controller.js';
import { UserQueryController } from './controllers/user.query.controller.js';
import { UserTestController } from './controllers/user.test.controller.js';

@Module({
  controllers: [UserCommandController, UserQueryController, UserTestController],
})
export class UserModule {}
