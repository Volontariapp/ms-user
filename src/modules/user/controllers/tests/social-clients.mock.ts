import { jest } from '@jest/globals';
import type { SocialRelationshipQueryClientService } from '../../clients/social-relationship.query-client.js';

export type SocialRelationshipClientMock = Pick<
  SocialRelationshipQueryClientService,
  'getMyFollows' | 'getMyFollowers'
>;

export const createSocialRelationshipClientMock =
  (): jest.Mocked<SocialRelationshipClientMock> => ({
    getMyFollows: jest.fn<SocialRelationshipQueryClientService['getMyFollows']>(),
    getMyFollowers: jest.fn<SocialRelationshipQueryClientService['getMyFollowers']>(),
  });
