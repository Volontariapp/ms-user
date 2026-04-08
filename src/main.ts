import './tracing.js';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { GRPC_SERVICES, getGrpcOptions } from '@volontariapp/contracts';
import { AppConfigService } from './config/app-config.service.js';
import { Logger } from '@volontariapp/logger';

async function bootstrap() {
  const logger = new Logger({ context: 'MS-USER', format: 'json' });
  const app = await NestFactory.create(AppModule, {
    logger,
  });
  app.useLogger(logger);
  const configService = app.get(AppConfigService);

  app.connectMicroservice(
    getGrpcOptions(GRPC_SERVICES.USER, configService.msUserUrl),
  );

  await app.startAllMicroservices();
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
