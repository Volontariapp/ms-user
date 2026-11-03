import { GetUsersByIdsQuery } from '@volontariapp/contracts-nest';
import { ArrayMaxSize, IsArray, IsString } from 'class-validator';

export const MAX_USERS_BY_IDS = 100;

export class GetUsersByIdsQueryDTO implements GetUsersByIdsQuery {
  @IsArray()
  @ArrayMaxSize(MAX_USERS_BY_IDS)
  @IsString({ each: true })
  ids!: string[];
}
