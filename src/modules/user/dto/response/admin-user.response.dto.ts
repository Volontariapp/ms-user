import type { AdminUserResponse } from '@volontariapp/contracts-nest';
import type { UserDTO } from '../common/user.dto.js';

export class AdminUserResponseDTO implements AdminUserResponse {
  user!: UserDTO;
}
