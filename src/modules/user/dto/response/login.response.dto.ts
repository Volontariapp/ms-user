import type { LoginResponse } from '@volontariapp/contracts-nest';
import type { AuthResponseDTO } from './auth.response.dto.js';

export class LoginResponseDTO implements LoginResponse {
  auth: AuthResponseDTO | undefined;
}
