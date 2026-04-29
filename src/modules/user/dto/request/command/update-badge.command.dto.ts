import type { UpdateBadgeCommand } from '@volontariapp/contracts-nest';
import { IsOptional, IsString } from 'class-validator';

export class UpdateBadgeCommandDTO implements UpdateBadgeCommand {
  @IsString()
  badgeId!: string;

  @IsString()
  @IsOptional()
  name?: string | undefined;

  @IsString()
  @IsOptional()
  slug?: string | undefined;

  @IsString()
  @IsOptional()
  iconPath?: string | undefined;

  @IsString()
  @IsOptional()
  description?: string | undefined;
}
