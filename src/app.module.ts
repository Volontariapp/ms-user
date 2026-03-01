import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/app-config.module';
import { DatabaseModule } from './providers/database/database.module';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [AppConfigModule, DatabaseModule, UserModule],
})
export class AppModule {}
