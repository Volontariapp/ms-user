import type { CreateBadgeCommand } from '@volontariapp/contracts-nest';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

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

  @IsUUID()
  @IsOptional()
  iconFileId?: string | undefined;

  @IsString()
  @IsNotEmpty()
  idempotencyKey!: string;
}
