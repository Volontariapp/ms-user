import { Controller, UseGuards } from '@nestjs/common';
import { GrpcMethod, Payload } from '@nestjs/microservices';
import { BADGE_QUERY_METHODS, BADGE_SERVICE_NAME } from '@volontariapp/contracts-nest';
import { CurrentUser, GrpcInternalGuard } from '@volontariapp/auth';
import type { AuthUser } from '@volontariapp/auth';
import { Logger } from '@volontariapp/logger';
import { BadgeId, BadgeService, BadgeSlug } from '@volontariapp/domain-user';
import { BadgeTransformer } from '../../transformers/badge.transformer.js';
import { GetBadgeQueryDTO } from '../../dto/request/query/get-badge.query.dto.js';
import { BadgeResponseDTO } from '../../dto/response/badge.response.dto.js';
import { ListBadgesResponseDTO } from '../../dto/response/list-badges.response.dto.js';
import { GetMyBadgeProgressQueryDTO } from '../../dto/request/query/get-my-badge-progress.query.dto.js';
import { GetMyBadgeProgressResponseDTO } from '../../dto/response/get-my-badge-progress.response.dto.js';
import { BadgeProgressService } from '../../services/badge-progress.service.js';

@Controller()
export class BadgeQueryController {
  private readonly logger = new Logger({ context: BadgeQueryController.name });

  constructor(
    private readonly badgeService: BadgeService,
    private readonly badgeTransformer: BadgeTransformer,
    private readonly badgeProgressService: BadgeProgressService,
  ) {}

  @GrpcMethod(BADGE_SERVICE_NAME, BADGE_QUERY_METHODS.GET_BADGE)
  async getBadge(@Payload() data: GetBadgeQueryDTO): Promise<BadgeResponseDTO> {
    this.logger.debug(`gRPC: Getting badge with id: ${data.badgeId}`);
    const badge = await this.badgeService.findById(new BadgeId(data.badgeId));
    return { badge: this.badgeTransformer.toBadgeDTO(badge) };
  }

  @GrpcMethod(BADGE_SERVICE_NAME, BADGE_QUERY_METHODS.GET_BADGE_BY_SLUG)
  async getBadgeBySlug(@Payload() data: { slug: string }): Promise<BadgeResponseDTO> {
    this.logger.debug(`gRPC: Getting badge with slug: ${data.slug}`);
    const badge = await this.badgeService.findBySlug(new BadgeSlug(data.slug));
    return { badge: this.badgeTransformer.toBadgeDTO(badge) };
  }

  @GrpcMethod(BADGE_SERVICE_NAME, BADGE_QUERY_METHODS.LIST_BADGES)
  async listBadges(): Promise<ListBadgesResponseDTO> {
    this.logger.debug('gRPC: Listing all badges');
    const badges = await this.badgeService.findAll();
    return { badges: badges.map((b) => this.badgeTransformer.toBadgeDTO(b)) };
  }

  @UseGuards(GrpcInternalGuard)
  @GrpcMethod(BADGE_SERVICE_NAME, 'GetMyBadgeProgress')
  async getMyBadgeProgress(
    @Payload() _data: GetMyBadgeProgressQueryDTO,
    @CurrentUser() user: AuthUser,
  ): Promise<GetMyBadgeProgressResponseDTO> {
    this.logger.debug(`gRPC: Getting badge progress for user: ${user.id}`);
    const progress = await this.badgeProgressService.getProgress(user.id);
    return { badges: progress.map((view) => this.badgeTransformer.toBadgeProgressDTO(view)) };
  }
}
