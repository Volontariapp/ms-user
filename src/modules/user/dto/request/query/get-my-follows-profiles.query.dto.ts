import type { GetMyFollowsProfilesQuery, PaginationRequest } from '@volontariapp/contracts-nest';
import { IsOptional } from 'class-validator';

export class GetMyFollowsProfilesQueryDTO implements GetMyFollowsProfilesQuery {
  @IsOptional()
  pagination: PaginationRequest | undefined;
}
