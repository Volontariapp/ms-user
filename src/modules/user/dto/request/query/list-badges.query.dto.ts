import type { ListBadgesQuery, PaginationRequest } from '@volontariapp/contracts-nest';
import { IsOptional } from 'class-validator';

export class ListBadgesQueryDTO implements ListBadgesQuery {
  @IsOptional()
  pagination: PaginationRequest | undefined;
}
