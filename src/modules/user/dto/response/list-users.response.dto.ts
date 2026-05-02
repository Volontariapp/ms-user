import type { ListUsersResponse, PaginationResponse } from '@volontariapp/contracts-nest';
import type { UserDTO } from '../common/user.dto.js';

export class ListUsersResponseDTO implements ListUsersResponse {
  users!: UserDTO[];
  pagination: PaginationResponse | undefined;
}
