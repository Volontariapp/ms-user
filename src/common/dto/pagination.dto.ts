import { PaginationRequest } from '@volontariapp/contracts-nest';
import { IsInt, Max, Min } from 'class-validator';

export const MAX_PAGINATION_LIMIT = 1000;

export class PaginationRequestDTO implements PaginationRequest {
  @IsInt()
  @Min(1)
  page!: number;

  @IsInt()
  @Min(1)
  @Max(MAX_PAGINATION_LIMIT)
  limit!: number;
}
