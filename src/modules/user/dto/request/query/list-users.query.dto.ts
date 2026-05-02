import type { ListUsersQuery, PaginationRequest } from '@volontariapp/contracts-nest';
import { IsOptional } from 'class-validator';

export class ListUsersQueryDTO implements ListUsersQuery {
  @IsOptional()
  pagination: PaginationRequest | undefined;
}
