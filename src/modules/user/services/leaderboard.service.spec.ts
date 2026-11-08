import { LeaderboardScope } from '@volontariapp/contracts-nest';
import {
  clampLimit,
  decodeCursor,
  encodeCursor,
  LEADERBOARD_DEFAULT_LIMIT,
  LEADERBOARD_MAX_LIMIT,
  periodStart,
  tierForRank,
} from './leaderboard.service';

describe('leaderboard helpers', () => {
  describe('clampLimit', () => {
    it('uses the default for zero, negative or non-finite limits', () => {
      expect(clampLimit(0)).toBe(LEADERBOARD_DEFAULT_LIMIT);
      expect(clampLimit(-3)).toBe(LEADERBOARD_DEFAULT_LIMIT);
      expect(clampLimit(Number.NaN)).toBe(LEADERBOARD_DEFAULT_LIMIT);
    });

    it('caps the limit at the maximum page size', () => {
      expect(clampLimit(10_000)).toBe(LEADERBOARD_MAX_LIMIT);
      expect(clampLimit(25)).toBe(25);
    });
  });

  describe('tierForRank', () => {
    it('gives tiers 1 to 3 to the podium only', () => {
      expect(tierForRank(1)).toBe(1);
      expect(tierForRank(2)).toBe(2);
      expect(tierForRank(3)).toBe(3);
      expect(tierForRank(4)).toBeUndefined();
      expect(tierForRank(0)).toBeUndefined();
    });
  });

  describe('cursor', () => {
    it('round-trips points and user id', () => {
      const cursor = { points: 4050, userId: '6f1c2e3a-0000-4000-8000-000000000001' };
      expect(decodeCursor(encodeCursor(cursor))).toEqual(cursor);
    });

    it('rejects a malformed cursor', () => {
      const malformed = Buffer.from(JSON.stringify({ points: 'x' }), 'utf8').toString('base64url');
      expect(() => decodeCursor(malformed)).toThrow('Invalid leaderboard cursor');
    });
  });

  describe('periodStart (Europe/Paris)', () => {
    it('starts the week on Monday midnight Paris time in winter (UTC+1)', () => {
      // Wednesday 2026-01-14 15:00 Paris -> Monday 2026-01-12 00:00 Paris = 2026-01-11 23:00 UTC
      const start = periodStart(
        LeaderboardScope.LEADERBOARD_SCOPE_WEEK,
        new Date('2026-01-14T14:00:00Z'),
      );
      expect(start.toISOString()).toBe('2026-01-11T23:00:00.000Z');
    });

    it('starts the month on the 1st at midnight Paris time in summer (UTC+2)', () => {
      // 2026-07-20 12:00 Paris -> 2026-07-01 00:00 Paris = 2026-06-30 22:00 UTC
      const start = periodStart(
        LeaderboardScope.LEADERBOARD_SCOPE_MONTH,
        new Date('2026-07-20T10:00:00Z'),
      );
      expect(start.toISOString()).toBe('2026-06-30T22:00:00.000Z');
    });

    it('keeps a Sunday in the ISO week that started the previous Monday', () => {
      // Sunday 2026-01-18 23:00 Paris -> Monday 2026-01-12 00:00 Paris
      const start = periodStart(
        LeaderboardScope.LEADERBOARD_SCOPE_WEEK,
        new Date('2026-01-18T22:00:00Z'),
      );
      expect(start.toISOString()).toBe('2026-01-11T23:00:00.000Z');
    });
  });
});
