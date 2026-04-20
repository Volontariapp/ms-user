import type { AuthResponse } from '@volontariapp/contracts-nest';

export class AuthResponseDTO implements AuthResponse {
  accessToken!: string;
  refreshToken!: string;
}
