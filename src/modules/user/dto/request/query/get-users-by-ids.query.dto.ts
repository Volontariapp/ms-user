import { GetUsersByIdsQuery } from '@volontariapp/contracts-nest';
import { IsArray, IsString } from 'class-validator';

export class GetUsersByIdsQueryDTO implements GetUsersByIdsQuery {
  @IsArray()
  @IsString({ each: true })
  ids!: string[];
}
