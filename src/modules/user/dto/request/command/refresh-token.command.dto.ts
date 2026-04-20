import type { RefreshTokenCommand } from '@volontariapp/contracts-nest';
import { IsString } from 'class-validator';

export class RefreshTokenCommandDTO implements RefreshTokenCommand {
  @IsString()
  refreshToken!: string;
}
