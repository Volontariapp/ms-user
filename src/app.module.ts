import { DynamicModule, Module } from '@nestjs/common';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { GlobalExceptionFilter } from '@volontariapp/errors-nest';
import { GrpcValidationPipe } from '@volontariapp/validation-nest';
import { AppConfigModule } from './config/app-config.module.js';
import type { CustomConfig } from './config/base-config.js';
import { DatabaseModule } from './providers/database/database.module.js';
import { UserModule } from './modules/user/user.module.js';
import { GrpcClientModule } from './grpc/grpc-client.module.js';

@Module({
  imports: [DatabaseModule, UserModule, GrpcClientModule],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {
  static register(config: CustomConfig): DynamicModule {
    return {
      module: AppModule,
      imports: [
        AppConfigModule.forRoot(config),
        DatabaseModule.forRoot(config.db),
        UserModule,
        GrpcClientModule,
      ],
      providers: [
        {
          provide: APP_FILTER,
          useClass: GlobalExceptionFilter,
        },
        {
          provide: APP_PIPE,
          useFactory: (): GrpcValidationPipe =>
            new GrpcValidationPipe({
              enumMaps: {},
            }),
        },
      ],
    };
  }
}
