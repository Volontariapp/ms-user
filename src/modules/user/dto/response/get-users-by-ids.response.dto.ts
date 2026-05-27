import type { GetUsersByIdsResponse, User, PaginationResponse } from '@volontariapp/contracts-nest';

export class GetUsersByIdsResponseDTO implements GetUsersByIdsResponse {
  users!: User[];
  pagination: PaginationResponse | undefined;
}
