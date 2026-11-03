import type { GetMyFollowsProfilesQuery } from '@volontariapp/contracts-nest';
import { Type } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';
import { PaginationRequestDTO } from '../../../../../common/dto/pagination.dto.js';

export class GetMyFollowsProfilesQueryDTO implements GetMyFollowsProfilesQuery {
  @IsOptional()
  @ValidateNested()
  @Type(() => PaginationRequestDTO)
  pagination: PaginationRequestDTO | undefined;
}
