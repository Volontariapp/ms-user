import type { UpdateUserCommand } from '@volontariapp/contracts-nest';
import {
  IsEmail,
  IsOptional,
  IsPhoneNumber,
  IsString,
  ValidateNested,
} from 'class-validator';
import { OrganisationInfoDTO } from '../../common/organisation-info.dto.js';
import { Type } from 'class-transformer';

export class UpdateUserCommandDTO implements UpdateUserCommand {
  @IsString()
  userId!: string;

  @IsEmail()
  @IsOptional()
  email?: string | undefined;

  @IsString()
  @IsOptional()
  previousPassword?: string | undefined;

  @IsString()
  @IsOptional()
  newPassword?: string | undefined;

  @IsPhoneNumber()
  @IsOptional()
  phone?: string | undefined;

  @IsString()
  @IsOptional()
  pseudo?: string | undefined;

  @IsString()
  @IsOptional()
  bio?: string | undefined;

  @IsString()
  @IsOptional()
  logoPath?: string | undefined;

  @ValidateNested()
  @IsOptional()
  @Type(() => OrganisationInfoDTO)
  organisationInfo?: OrganisationInfoDTO | undefined;
}
