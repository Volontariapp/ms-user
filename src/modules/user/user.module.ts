import { Module } from '@nestjs/common';
import { UserController } from './user.controller.js';
import { UserGrpcController } from './user.grpc.controller.js';

@Module({
  controllers: [UserController, UserGrpcController],
})
export class UserModule {}
