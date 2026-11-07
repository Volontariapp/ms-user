import { Controller, UseGuards } from '@nestjs/common';
import { GrpcMethod, Payload } from '@nestjs/microservices';
import {
  LeaderboardScope,
  USER_SERVICE_NAME,
  type GetLeaderboardQuery,
  type GetLeaderboardResponse,
  type GetMyRankQuery,
  type GetMyRankResponse,
  type LeaderboardEntry,
} from '@volontariapp/contracts-nest';
import { CurrentUser, GrpcInternalGuard } from '@volontariapp/auth';
import type { AuthUser } from '@volontariapp/auth';
import { Logger } from '@volontariapp/logger';
import {
  LeaderboardService,
  tierForRank,
  type LeaderboardRow,
} from '../../services/leaderboard.service.js';

@Controller()
export class LeaderboardQueryController {
  private readonly logger = new Logger({ context: LeaderboardQueryController.name });

  constructor(private readonly leaderboardService: LeaderboardService) {}

  @UseGuards(GrpcInternalGuard)
  @GrpcMethod(USER_SERVICE_NAME, 'GetLeaderboard')
  async getLeaderboard(@Payload() data: GetLeaderboardQuery): Promise<GetLeaderboardResponse> {
    const scope = resolveScope(data.scope);
    this.logger.log(`gRPC: Getting leaderboard for scope: ${String(scope)}`);
    const page = await this.leaderboardService.getPage(scope, data.limit, data.cursor);
    return {
      entries: page.rows.map((row) => toEntry(row, scope)),
      nextCursor: page.nextCursor,
    };
  }

  @UseGuards(GrpcInternalGuard)
  @GrpcMethod(USER_SERVICE_NAME, 'GetMyRank')
  async getMyRank(
    @Payload() data: GetMyRankQuery,
    @CurrentUser() user: AuthUser,
  ): Promise<GetMyRankResponse> {
    const scope = resolveScope(data.scope);
    this.logger.log(`gRPC: Getting leaderboard rank for user: ${user.id}`);
    const result = await this.leaderboardService.getMyRank(scope, user.id);
    return {
      me: result.me ? toEntry(result.me, scope) : undefined,
      neighbors: result.neighbors.map((row) => toEntry(row, scope)),
    };
  }
}

/** Un scope non précisé (valeur 0) est traité comme le classement global. */
function resolveScope(scope: LeaderboardScope): LeaderboardScope {
  return scope === LeaderboardScope.LEADERBOARD_SCOPE_UNSPECIFIED
    ? LeaderboardScope.LEADERBOARD_SCOPE_GLOBAL
    : scope;
}

function toEntry(row: LeaderboardRow, scope: LeaderboardScope): LeaderboardEntry {
  const tier = tierForRank(row.rank);
  return {
    userId: row.userId,
    pseudo: row.pseudo,
    avatarFileId: row.avatarFileId ?? undefined,
    points: row.points,
    rank: row.rank,
    distinctions: tier === undefined ? [] : [{ scope, tier }],
  };
}
