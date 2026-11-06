import { BadgeEntity } from '@volontariapp/domain-user';
import { BadgeTransformer } from './badge.transformer';
import type { BadgeProgressView } from '../services/badge-progress.service';

describe('BadgeTransformer', () => {
  const transformer = new BadgeTransformer();

  const entity = (overrides: Partial<BadgeEntity>): BadgeEntity => {
    const badge = new BadgeEntity();
    badge.id = '00000000-0000-4000-8000-000000000001';
    badge.name = 'Pilier';
    badge.slug = 'EVENT_PARTICIPATION_TIER_3';
    badge.description = 'Participer a 10 evenements';
    Object.assign(badge, overrides);
    return badge;
  };

  describe('toBadgeDTO', () => {
    it('uses the stored points when present', () => {
      expect(transformer.toBadgeDTO(entity({ points: 42 })).points).toBe(42);
    });

    it('falls back to the catalogue points when the column is null', () => {
      expect(transformer.toBadgeDTO(entity({ points: undefined })).points).toBe(500);
    });

    it('returns 0 points for a slug unknown to the catalogue', () => {
      expect(transformer.toBadgeDTO(entity({ slug: 'CUSTOM', points: undefined })).points).toBe(0);
    });
  });

  describe('toBadgeProgressDTO', () => {
    const view = (overrides: Partial<BadgeProgressView>): BadgeProgressView => ({
      slug: 'SOCIAL_LIKE_COUNT_10',
      name: 'Soutien du coeur',
      description: 'Liker 10 posts',
      points: 100,
      unlocked: false,
      percent: 40,
      requirements: [{ metric: 'SOCIAL_LIKES_GIVEN', current: 4, target: 10 }],
      ...overrides,
    });

    it('maps a locked badge without award date', () => {
      const dto = transformer.toBadgeProgressDTO(view({}));

      expect(dto.awardedAt).toBeUndefined();
      expect(dto).toMatchObject({ slug: 'SOCIAL_LIKE_COUNT_10', unlocked: false, percent: 40, points: 100 });
      expect(dto.requirements).toEqual([{ metric: 'SOCIAL_LIKES_GIVEN', current: 4, target: 10 }]);
    });

    it('converts the award date to a protobuf timestamp', () => {
      const dto = transformer.toBadgeProgressDTO(
        view({ unlocked: true, percent: 100, awardedAt: new Date('2026-11-06T10:00:00.250Z') }),
      );

      expect(dto.awardedAt).toEqual({ seconds: 1793959200, nanos: 250_000_000 });
    });
  });
});
