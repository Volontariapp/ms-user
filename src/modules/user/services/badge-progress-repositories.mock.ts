import { jest } from '@jest/globals';
import type { BadgeModel, BadgeProgressModel, UserBadgeModel } from '@volontariapp/domain-user';
import type { Repository } from 'typeorm';

export interface BadgeProgressRepositoriesMock {
  progress: jest.Mocked<Pick<Repository<BadgeProgressModel>, 'findBy'>>;
  userBadges: jest.Mocked<Pick<Repository<UserBadgeModel>, 'find'>>;
  badges: jest.Mocked<Pick<Repository<BadgeModel>, 'find'>>;
}

export const createBadgeProgressRepositoriesMock = (): BadgeProgressRepositoriesMock => ({
  progress: { findBy: jest.fn<Repository<BadgeProgressModel>['findBy']>() },
  userBadges: { find: jest.fn<Repository<UserBadgeModel>['find']>() },
  badges: { find: jest.fn<Repository<BadgeModel>['find']>() },
});
