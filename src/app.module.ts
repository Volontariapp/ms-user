import { DynamicModule, Module } from '@nestjs/common';
import { AppConfigModule } from './config/app-config.module.js';
import type { CustomConfig } from './config/base-config.js';
import { DatabaseModule } from './providers/database/database.module.js';
import { UserModule } from './modules/user/user.module.js';
import { GrpcClientModule } from './grpc/grpc-client.module.js';

@Module({
  imports: [DatabaseModule, UserModule, GrpcClientModule],
})
export class AppModule {
  static register(config: CustomConfig): DynamicModule {
    return {
      module: AppModule,
      imports: [
        AppConfigModule.forRoot(config),
        DatabaseModule,
        UserModule,
        GrpcClientModule,
      ],
    };
  }
}
