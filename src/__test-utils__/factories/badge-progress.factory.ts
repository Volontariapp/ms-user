import { BadgeModel, BadgeProgressModel, UserBadgeModel } from '@volontariapp/domain-user';

export const BADGE_PROGRESS_USER_ID = '123e4567-e89b-42d3-a456-426614174000';

export class BadgeProgressFactory {
  static counter(
    metric: string,
    value: number,
    userId: string = BADGE_PROGRESS_USER_ID,
  ): BadgeProgressModel {
    const row = new BadgeProgressModel();
    row.userId = userId;
    row.metric = metric;
    row.value = value;
    row.updatedAt = new Date('2026-11-06T10:00:00Z');
    return row;
  }

  static badge(slug: string, overrides: Partial<BadgeModel> = {}): BadgeModel {
    const badge = new BadgeModel();
    badge.id =
      overrides.id ?? `00000000-0000-4000-8000-${slug.length.toString().padStart(12, '0')}`;
    badge.name = overrides.name ?? `Name of ${slug}`;
    badge.slug = slug;
    badge.description = overrides.description ?? `Description of ${slug}`;
    badge.points = overrides.points;
    return badge;
  }

  static owned(
    slug: string,
    awardedAt: Date,
    userId: string = BADGE_PROGRESS_USER_ID,
  ): UserBadgeModel {
    const owned = new UserBadgeModel();
    owned.userId = userId;
    owned.badge = BadgeProgressFactory.badge(slug);
    owned.badgeId = owned.badge.id;
    owned.awardedAt = awardedAt;
    return owned;
  }
}
