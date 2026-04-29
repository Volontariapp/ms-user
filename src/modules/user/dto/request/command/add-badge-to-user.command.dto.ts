import { AddBadgeToUserCommand } from '@volontariapp/contracts-nest';
import { IsString } from 'class-validator';

export class AddBadgeToUserCommandDTO implements AddBadgeToUserCommand {
  @IsString()
  userId!: string;

  @IsString()
  badgeId!: string;
}
