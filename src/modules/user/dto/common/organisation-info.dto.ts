import type { OrganisationInfo } from '@volontariapp/contracts-nest';
import { IsString } from 'class-validator';

export class OrganisationInfoDTO implements OrganisationInfo {
  @IsString()
  rna!: string;
}
