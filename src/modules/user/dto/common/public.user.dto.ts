import type { UserPublic } from '@volontariapp/contracts-nest';
import { OrganisationInfoDTO } from './organisation-info.dto.js';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { BadgeDTO } from './badge.dto.js';
import { UserRoles } from '@volontariapp/shared';

export class PublicUserDTO implements UserPublic {
  @IsUUID()
  id!: string;

  @IsString()
  pseudo!: string;

  @IsEnum(UserRoles)
  role!: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  logoPath?: string;

  @IsInt()
  @Min(0)
  totalImpactScore!: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => OrganisationInfoDTO)
  organisationInfo?: OrganisationInfoDTO | undefined;

  @ValidateNested({ each: true })
  @Type(() => BadgeDTO)
  badges!: BadgeDTO[];
}
