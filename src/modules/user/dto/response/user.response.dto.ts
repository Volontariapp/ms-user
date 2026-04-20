import type { UserResponse } from '@volontariapp/contracts-nest';
import type { UserDTO } from '../common/user.dto.js';

export class UserResponseDTO implements UserResponse {
  user!: UserDTO;
}
