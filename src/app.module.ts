import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/app-config.module.js';
import { DatabaseModule } from './providers/database/database.module.js';
import { UserModule } from './modules/user/user.module.js';

@Module({
  imports: [AppConfigModule, DatabaseModule, UserModule],
})
export class AppModule {}
