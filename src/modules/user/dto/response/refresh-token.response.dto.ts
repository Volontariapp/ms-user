import type { RefreshTokenResponse } from '@volontariapp/contracts-nest';
import type { AuthResponseDTO } from './auth.response.dto.js';

export class RefreshTokenResponseDTO implements RefreshTokenResponse {
  auth: AuthResponseDTO | undefined;
}
