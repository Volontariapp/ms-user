import type { AdminDeleteUserCommand } from '@volontariapp/contracts-nest';
import { IsString } from 'class-validator';

export class AdminDeleteUserCommandDTO implements AdminDeleteUserCommand {
  @IsString()
  userId!: string;
}
