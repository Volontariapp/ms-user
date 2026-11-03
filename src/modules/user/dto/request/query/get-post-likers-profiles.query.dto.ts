import type { GetPostLikersProfilesQuery } from '@volontariapp/contracts-nest';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { PaginationRequestDTO } from '../../../../../common/dto/pagination.dto.js';

export class GetPostLikersProfilesQueryDTO implements GetPostLikersProfilesQuery {
  @IsString()
  @IsNotEmpty()
  postId!: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => PaginationRequestDTO)
  pagination: PaginationRequestDTO | undefined;
}
