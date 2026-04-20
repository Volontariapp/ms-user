import type { Badge } from '@volontariapp/contracts-nest';
import { IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { TimestampDTO } from './timestamp.dto.js';
import { Type } from 'class-transformer';

export class BadgeDTO implements Badge {
  @IsUUID()
  id!: string;

  @IsString()
  name!: string;

  @IsString()
  slug!: string;

  @IsOptional()
  @IsString()
  iconPath?: string | undefined;

  @IsString()
  description!: string;

  @ValidateNested()
  @Type(() => TimestampDTO)
  awardedAt: TimestampDTO | undefined;
}
