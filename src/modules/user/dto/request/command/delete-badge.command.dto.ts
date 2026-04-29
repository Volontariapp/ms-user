import type { DeleteBadgeCommand } from '@volontariapp/contracts-nest';
import { IsString } from 'class-validator';

export class DeleteBadgeCommandDTO implements DeleteBadgeCommand {
  @IsString()
  badgeId!: string;
}
