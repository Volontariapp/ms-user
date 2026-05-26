import type { GetMyFollowersProfilesQuery, PaginationRequest } from '@volontariapp/contracts-nest';
import { IsOptional } from 'class-validator';

export class GetMyFollowersProfilesQueryDTO implements GetMyFollowersProfilesQuery {
  @IsOptional()
  pagination: PaginationRequest | undefined;
}
