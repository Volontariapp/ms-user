import type { CreateBadgeCommand } from '@volontariapp/contracts-nest';
import { IsOptional, IsString } from 'class-validator';

export class CreateBadgeCommandDTO implements CreateBadgeCommand {
  @IsString()
  name!: string;

  @IsString()
  slug!: string;

  @IsString()
  @IsOptional()
  iconPath?: string | undefined;

  @IsString()
  description!: string;
}
