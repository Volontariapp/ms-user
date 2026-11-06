import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BadgeModel, BadgeProgressModel, UserBadgeModel } from '@volontariapp/domain-user';
import { computeBadgeProgress, type BadgeProgressResult } from '@volontariapp/shared';
import { Repository } from 'typeorm';

export interface BadgeProgressView extends BadgeProgressResult {
  readonly name: string;
  readonly description: string;
  readonly iconFileId?: string;
}

/**
 * Progression d'un utilisateur vers chaque badge du catalogue de `@volontariapp/shared`.
 * `unlocked` vient de `user_badges` ; les compteurs de `badge_progress` ne servent qu'au pourcentage.
 */
@Injectable()
export class BadgeProgressService {
  constructor(
    @InjectRepository(BadgeProgressModel)
    private readonly progressRepository: Repository<BadgeProgressModel>,
    @InjectRepository(UserBadgeModel)
    private readonly userBadgeRepository: Repository<UserBadgeModel>,
    @InjectRepository(BadgeModel)
    private readonly badgeRepository: Repository<BadgeModel>,
  ) {}

  async getProgress(userId: string): Promise<BadgeProgressView[]> {
    const [counterRows, ownedRows, badgeRows] = await Promise.all([
      this.progressRepository.findBy({ userId }),
      this.userBadgeRepository.find({ where: { userId }, relations: { badge: true } }),
      this.badgeRepository.find(),
    ]);

    const counters: Record<string, number> = {};
    for (const row of counterRows) {
      counters[row.metric] = row.value;
    }

    const awarded = new Map<string, Date | undefined>();
    for (const owned of ownedRows) {
      awarded.set(owned.badge.slug, owned.awardedAt);
    }

    const badgesBySlug = new Map(badgeRows.map((badge) => [badge.slug, badge]));

    return computeBadgeProgress({ counters, awarded }).map((result) => {
      const badge = badgesBySlug.get(result.slug);
      return {
        ...result,
        name: badge?.name ?? result.slug,
        description: badge?.description ?? '',
      };
    });
  }
}
