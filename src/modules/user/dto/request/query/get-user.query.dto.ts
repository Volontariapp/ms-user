import type { GetUserQuery } from '@volontariapp/contracts-nest';
import { IsString } from 'class-validator';

export class GetUserQueryDTO implements GetUserQuery {
  @IsString()
  userId!: string;
}
