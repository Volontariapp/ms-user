import type { SignUpResponse } from '@volontariapp/contracts-nest';
import type { UserDTO } from '../common/user.dto.js';
import type { AuthResponseDTO } from './auth.response.dto.js';

export class SignUpResponseDTO implements SignUpResponse {
  user!: UserDTO;
  auth!: AuthResponseDTO;
}
