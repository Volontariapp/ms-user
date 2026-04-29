import type { RemoveBadgeFromUserCommand } from '@volontariapp/contracts-nest';
import { IsString } from 'class-validator';

export class RemoveBadgeFromUserCommandDTO implements RemoveBadgeFromUserCommand {
  @IsString()
  userId!: string;

  @IsString()
  badgeId!: string;
}
