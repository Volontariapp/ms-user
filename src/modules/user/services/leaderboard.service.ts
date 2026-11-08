import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { LeaderboardScope } from '@volontariapp/contracts-nest';
import { DataSource } from 'typeorm';

export const LEADERBOARD_MAX_LIMIT = 100;
export const LEADERBOARD_DEFAULT_LIMIT = 20;
export const LEADERBOARD_NEIGHBORS_PER_SIDE = 5;
export const LEADERBOARD_TIERS = 3;

export interface LeaderboardRow {
  readonly userId: string;
  readonly pseudo: string;
  readonly avatarFileId: string | null;
  readonly points: number;
  readonly rank: number;
}

export interface LeaderboardPage {
  readonly rows: LeaderboardRow[];
  readonly nextCursor?: string;
}

export interface LeaderboardCursor {
  readonly points: number;
  readonly userId: string;
}

/** Fuseau de référence des périodes : semaine et mois commencent à minuit, heure de Paris. */
const PARIS_TIMEZONE = 'Europe/Paris';

/** Ordre des jours pour trouver le lundi (semaine ISO). */
const ISO_WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

type SqlParam = string | number | Date;

/**
 * Lecture du classement (global, semaine, mois). Pas d'état stocké : le global lit
 * `users.total_impact_score`, les périodes somment les crédits datés des deux ledgers
 * (`impact_score_credits` et `badge_point_credits`).
 */
@Injectable()
export class LeaderboardService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async getPage(scope: LeaderboardScope, limit: number, cursor?: string): Promise<LeaderboardPage> {
    const pageSize = clampLimit(limit);
    const after = cursor ? decodeCursor(cursor) : undefined;
    const ranked = this.rankedSql(scope);

    const base = ranked.params.length;
    const cursorParams: SqlParam[] = after ? [after.points, after.userId] : [];
    const cursorClause = after
      ? `WHERE ranked.points < ${placeholder(base + 1)}
          OR (ranked.points = ${placeholder(base + 1)} AND ranked."userId" > ${placeholder(base + 2)})`
      : '';

    const rows = await this.dataSource.query<LeaderboardRow[]>(
      `${ranked.sql} ${cursorClause}
       ORDER BY ranked.points DESC, ranked."userId" ASC
       LIMIT ${placeholder(base + cursorParams.length + 1)}`,
      [...ranked.params, ...cursorParams, pageSize + 1],
    );

    const hasNext = rows.length > pageSize;
    const pageRows = rows.slice(0, pageSize);
    const last = pageRows.at(-1);

    return {
      rows: pageRows,
      nextCursor:
        hasNext && last ? encodeCursor({ points: last.points, userId: last.userId }) : undefined,
    };
  }

  async getMyRank(
    scope: LeaderboardScope,
    userId: string,
  ): Promise<{ me?: LeaderboardRow; neighbors: LeaderboardRow[] }> {
    const ranked = this.rankedSql(scope);
    const own = await this.dataSource.query<LeaderboardRow[]>(
      `${ranked.sql} WHERE ranked."userId" = ${placeholder(ranked.params.length + 1)}`,
      [...ranked.params, userId],
    );
    const me = own.at(0);
    if (!me || me.points <= 0) {
      return { me: undefined, neighbors: [] };
    }

    const above = await this.dataSource.query<LeaderboardRow[]>(
      `${ranked.sql}
       WHERE ranked.points > ${placeholder(ranked.params.length + 1)}
       ORDER BY ranked.points ASC, ranked."userId" DESC
       LIMIT ${placeholder(ranked.params.length + 2)}`,
      [...ranked.params, me.points, LEADERBOARD_NEIGHBORS_PER_SIDE],
    );

    const base = ranked.params.length;
    const below = await this.dataSource.query<LeaderboardRow[]>(
      `${ranked.sql}
       WHERE ranked.points < ${placeholder(base + 1)}
          OR (ranked.points = ${placeholder(base + 1)} AND ranked."userId" > ${placeholder(base + 2)})
       ORDER BY ranked.points DESC, ranked."userId" ASC
       LIMIT ${placeholder(base + 3)}`,
      [...ranked.params, me.points, me.userId, LEADERBOARD_NEIGHBORS_PER_SIDE],
    );

    return { me, neighbors: [...above.reverse(), ...below] };
  }

  /**
   * Sous-requête commune : un rang RANK() par utilisateur classé (les ex æquo partagent
   * le même rang). Les appelants ajoutent leur propre filtre sur `ranked`.
   */
  private rankedSql(scope: LeaderboardScope): { sql: string; params: SqlParam[] } {
    const params: SqlParam[] = [];
    const source = this.scoreSource(scope, params);

    const sql = `
      WITH scored AS (${source})
      SELECT * FROM (
        SELECT
          score.user_id AS "userId",
          u.pseudo AS pseudo,
          u.avatar_file_id AS "avatarFileId",
          score.points AS points,
          CAST(RANK() OVER (ORDER BY score.points DESC) AS integer) AS rank
        FROM scored score
        JOIN users u ON u.id = score.user_id
      ) ranked`;

    return { sql, params };
  }

  /** Points par utilisateur (total global ou période). Exclut les comptes en suppression. */
  private scoreSource(scope: LeaderboardScope, params: SqlParam[]): string {
    if (
      scope === LeaderboardScope.LEADERBOARD_SCOPE_WEEK ||
      scope === LeaderboardScope.LEADERBOARD_SCOPE_MONTH
    ) {
      params.push(periodStart(scope, new Date()));
      return `
        SELECT credits.user_id, SUM(credits.points)::int AS points
        FROM (
          SELECT user_id, score AS points, created_at FROM impact_score_credits
          UNION ALL
          SELECT user_id, points, created_at FROM badge_point_credits
        ) credits
        JOIN users active ON active.id = credits.user_id AND active.status <> 'PENDING_DELETION'
        WHERE credits.created_at AT TIME ZONE 'UTC' >= ${placeholder(params.length)}
        GROUP BY credits.user_id
        HAVING SUM(credits.points) > 0`;
    }

    return `
      SELECT id AS user_id, total_impact_score::int AS points
      FROM users
      WHERE status <> 'PENDING_DELETION' AND total_impact_score > 0`;
  }
}

/** Placeholder positionnel PostgreSQL ($1, $2...). */
export function placeholder(position: number): string {
  return `$${String(position)}`;
}

export function clampLimit(limit: number): number {
  if (!Number.isFinite(limit) || limit <= 0) {
    return LEADERBOARD_DEFAULT_LIMIT;
  }
  return Math.min(Math.floor(limit), LEADERBOARD_MAX_LIMIT);
}

/** Distinction de rang : 1 à 3 pour le podium, aucune au-delà. */
export function tierForRank(rank: number): number | undefined {
  return rank >= 1 && rank <= LEADERBOARD_TIERS ? rank : undefined;
}

export function encodeCursor(cursor: LeaderboardCursor): string {
  return Buffer.from(JSON.stringify(cursor), 'utf8').toString('base64url');
}

export function decodeCursor(encoded: string): LeaderboardCursor {
  const parsed = JSON.parse(
    Buffer.from(encoded, 'base64url').toString('utf8'),
  ) as Partial<LeaderboardCursor>;
  if (typeof parsed.points !== 'number' || typeof parsed.userId !== 'string') {
    throw new Error('Invalid leaderboard cursor');
  }
  return { points: parsed.points, userId: parsed.userId };
}

/**
 * Début de la période en instant UTC : lundi 00h00 (semaine ISO) ou 1er du mois 00h00,
 * heure de Paris.
 */
export function periodStart(scope: LeaderboardScope, now: Date): Date {
  const parts = parisDateParts(now);
  if (scope === LeaderboardScope.LEADERBOARD_SCOPE_WEEK) {
    const mondayOffset = ISO_WEEKDAYS.indexOf(parts.weekday);
    return parisMidnight(parts.year, parts.month, parts.day - mondayOffset);
  }
  return parisMidnight(parts.year, parts.month, 1);
}

interface ParisDateParts {
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly weekday: string;
}

function parisDateParts(instant: Date): ParisDateParts {
  const formatted = new Intl.DateTimeFormat('en-US', {
    timeZone: PARIS_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  }).formatToParts(instant);

  const read = (type: Intl.DateTimeFormatPartTypes): string =>
    formatted.find((part) => part.type === type)?.value ?? '';

  return {
    year: Number(read('year')),
    month: Number(read('month')),
    day: Number(read('day')),
    weekday: read('weekday'),
  };
}

/** Instant UTC de minuit à Paris pour une date calendaire, heure d'été comprise. */
function parisMidnight(year: number, month: number, day: number): Date {
  const naiveUtc = Date.UTC(year, month - 1, day);
  const firstGuess = naiveUtc - parisOffsetMs(new Date(naiveUtc));
  return new Date(naiveUtc - parisOffsetMs(new Date(firstGuess)));
}

/** Décalage de Paris par rapport à UTC, en millisecondes, à l'instant donné. */
function parisOffsetMs(instant: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: PARIS_TIMEZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(instant);
  const read = (type: Intl.DateTimeFormatPartTypes): number =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);

  const wallClockAsUtc = Date.UTC(
    read('year'),
    read('month') - 1,
    read('day'),
    read('hour'),
    read('minute'),
    read('second'),
  );
  const truncated = Math.floor(instant.getTime() / 1000) * 1000;
  return wallClockAsUtc - truncated;
}
