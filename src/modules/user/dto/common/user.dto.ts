import type { User } from '@volontariapp/contracts-nest';
import { OrganisationInfoDTO } from './organisation-info.dto.js';
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BadgeDTO } from './badge.dto.js';
import { UserRoles } from '@volontariapp/shared';

export class UserDTO implements User {
  @IsUUID()
  id!: string;

  @IsEmail()
  email!: string;

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
