import { BADGE_CATALOG } from '@volontariapp/shared';
import type { Repository } from 'typeorm';
import type { BadgeModel, BadgeProgressModel, UserBadgeModel } from '@volontariapp/domain-user';
import {
  BADGE_PROGRESS_USER_ID,
  BadgeProgressFactory,
} from '../../../__test-utils__/factories/badge-progress.factory';
import {
  createBadgeProgressRepositoriesMock,
  type BadgeProgressRepositoriesMock,
} from './badge-progress-repositories.mock';
import { BadgeProgressService } from './badge-progress.service';

describe('BadgeProgressService', () => {
  let repositories: BadgeProgressRepositoriesMock;
  let service: BadgeProgressService;

  beforeEach(() => {
    repositories = createBadgeProgressRepositoriesMock();
    repositories.progress.findBy.mockResolvedValue([]);
    repositories.userBadges.find.mockResolvedValue([]);
    repositories.badges.find.mockResolvedValue([]);
    service = new BadgeProgressService(
      repositories.progress as unknown as Repository<BadgeProgressModel>,
      repositories.userBadges as unknown as Repository<UserBadgeModel>,
      repositories.badges as unknown as Repository<BadgeModel>,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns one entry per catalogue badge at 0 percent for a new user', async () => {
    const result = await service.getProgress(BADGE_PROGRESS_USER_ID);

    expect(result).toHaveLength(BADGE_CATALOG.length);
    expect(result.every((entry) => entry.percent === 0 && !entry.unlocked)).toBe(true);
    expect(repositories.progress.findBy).toHaveBeenCalledWith({ userId: BADGE_PROGRESS_USER_ID });
  });

  it('computes the percentage from the badge_progress counters', async () => {
    repositories.progress.findBy.mockResolvedValue([
      BadgeProgressFactory.counter('EVENTS_FINISHED_TOTAL', 3),
    ]);

    const result = await service.getProgress(BADGE_PROGRESS_USER_ID);
    const tier2 = result.find((entry) => entry.slug === 'EVENT_PARTICIPATION_TIER_2');

    expect(tier2?.percent).toBe(60);
    expect(tier2?.requirements).toEqual([{ metric: 'EVENTS_FINISHED_TOTAL', current: 3, target: 5 }]);
  });

  it('marks an owned badge as unlocked at 100 percent with its award date, even without counters', async () => {
    const awardedAt = new Date('2026-11-01T08:30:00Z');
    repositories.userBadges.find.mockResolvedValue([
      BadgeProgressFactory.owned('SOCIAL_LIKE_COUNT_10', awardedAt),
    ]);

    const result = await service.getProgress(BADGE_PROGRESS_USER_ID);
    const like = result.find((entry) => entry.slug === 'SOCIAL_LIKE_COUNT_10');

    expect(like).toMatchObject({ unlocked: true, percent: 100, awardedAt, points: 100 });
  });

  it('takes name and description from the badges table and falls back to the slug', async () => {
    repositories.badges.find.mockResolvedValue([
      BadgeProgressFactory.badge('EVENT_HOST_COUNT_1', { name: 'Batisseur', description: 'Creer 1 evenement' }),
    ]);

    const result = await service.getProgress(BADGE_PROGRESS_USER_ID);

    expect(result.find((e) => e.slug === 'EVENT_HOST_COUNT_1')).toMatchObject({
      name: 'Batisseur',
      description: 'Creer 1 evenement',
    });
    expect(result.find((e) => e.slug === 'COMMUNITY_POST_COUNT_1')).toMatchObject({
      name: 'COMMUNITY_POST_COUNT_1',
      description: '',
    });
  });
});
