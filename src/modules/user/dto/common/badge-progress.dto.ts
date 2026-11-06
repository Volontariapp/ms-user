import type { BadgeProgress, BadgeRequirementProgress } from '@volontariapp/contracts-nest';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';
import { TimestampDTO } from './timestamp.dto.js';

export class BadgeRequirementProgressDTO implements BadgeRequirementProgress {
  @IsString()
  metric!: string;

  @IsInt()
  @Min(0)
  current!: number;

  @IsInt()
  @Min(1)
  target!: number;
}

export class BadgeProgressDTO implements BadgeProgress {
  @IsString()
  slug!: string;

  @IsString()
  name!: string;

  @IsString()
  description!: string;

  @IsInt()
  points!: number;

  @IsBoolean()
  unlocked!: boolean;

  @ValidateNested()
  @Type(() => TimestampDTO)
  awardedAt: TimestampDTO | undefined;

  @IsInt()
  @Min(0)
  @Max(100)
  percent!: number;

  @ValidateNested({ each: true })
  @Type(() => BadgeRequirementProgressDTO)
  requirements!: BadgeRequirementProgressDTO[];

  @IsOptional()
  @IsString()
  iconFileId?: string | undefined;
}
