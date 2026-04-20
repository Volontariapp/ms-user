import type { DeleteUserCommand } from '@volontariapp/contracts-nest';
import { IsString } from 'class-validator';

export class DeleteUserCommandDTO implements DeleteUserCommand {
  @IsString()
  userId!: string;
}
