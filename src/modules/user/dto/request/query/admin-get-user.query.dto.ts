import type { AdminGetUserQuery } from '@volontariapp/contracts-nest';
import { IsString } from 'class-validator';

export class AdminGetUserQueryDTO implements AdminGetUserQuery {
  @IsString()
  userId!: string;
}
