import { jest } from '@jest/globals';
import type { AuthUser } from '@volontariapp/auth';
import type { BadgeService } from '@volontariapp/domain-user';
import { BadgeQueryController } from '../queries/badge.query.controller';
import { BadgeTransformer } from '../../transformers/badge.transformer';
import type { BadgeProgressService, BadgeProgressView } from '../../services/badge-progress.service';
import { GetMyBadgeProgressQueryDTO } from '../../dto/request/query/get-my-badge-progress.query.dto';

describe('BadgeQueryController.getMyBadgeProgress', () => {
  const authUser: AuthUser = { id: '123e4567-e89b-42d3-a456-426614174000', role: 'VOLUNTEER' };
  const getProgress = jest.fn<BadgeProgressService['getProgress']>();
  let controller: BadgeQueryController;

  beforeEach(() => {
    controller = new BadgeQueryController(
      {} as unknown as BadgeService,
      new BadgeTransformer(),
      { getProgress } as unknown as BadgeProgressService,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
    getProgress.mockReset();
  });

  it('returns the progress of the authenticated user, mapped to DTOs', async () => {
    const view: BadgeProgressView = {
      slug: 'EVENT_HOST_COUNT_1',
      name: 'Batisseur',
      description: 'Creer 1 evenement',
      points: 200,
      unlocked: false,
      percent: 0,
      requirements: [{ metric: 'EVENTS_CREATED', current: 0, target: 1 }],
    };
    getProgress.mockResolvedValue([view]);

    const response = await controller.getMyBadgeProgress(new GetMyBadgeProgressQueryDTO(), authUser);

    expect(getProgress).toHaveBeenCalledWith(authUser.id);
    expect(response.badges).toHaveLength(1);
    expect(response.badges[0]).toMatchObject({ slug: 'EVENT_HOST_COUNT_1', points: 200, percent: 0 });
  });
});
