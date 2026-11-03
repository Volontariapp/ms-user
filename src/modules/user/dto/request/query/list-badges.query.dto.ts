import type { ListBadgesQuery } from '@volontariapp/contracts-nest';
import { Type } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';
import { PaginationRequestDTO } from '../../../../../common/dto/pagination.dto.js';

export class ListBadgesQueryDTO implements ListBadgesQuery {
  @IsOptional()
  @ValidateNested()
  @Type(() => PaginationRequestDTO)
  pagination: PaginationRequestDTO | undefined;
}
