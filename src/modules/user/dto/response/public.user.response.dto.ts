import type { PublicUserResponse } from '@volontariapp/contracts-nest';
import type { PublicUserDTO } from '../common/public.user.dto.js';

export class PublicUserResponseDto implements PublicUserResponse {
  userPublic!: PublicUserDTO;
}
