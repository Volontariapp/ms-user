import type { GetBadgeQuery } from '@volontariapp/contracts-nest';
import { IsString } from 'class-validator';

export class GetBadgeQueryDTO implements GetBadgeQuery {
  @IsString()
  badgeId!: string;
}
