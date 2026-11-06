import type { GetMyBadgeProgressResponse } from '@volontariapp/contracts-nest';
import type { BadgeProgressDTO } from '../common/badge-progress.dto.js';

export class GetMyBadgeProgressResponseDTO implements GetMyBadgeProgressResponse {
  badges!: BadgeProgressDTO[];
}
