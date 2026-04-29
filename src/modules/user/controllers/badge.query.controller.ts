import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { BADGE_QUERY_METHODS, BADGE_SERVICE_NAME } from '@volontariapp/contracts-nest';
import { Logger } from '@volontariapp/logger';
import { BadgeId, BadgeService, BadgeSlug } from '@volontariapp/domain-user';
import { BadgeTransformer } from '../transformers/badge.transformer.js';
import { GetBadgeQueryDTO } from '../dto/request/query/get-badge.query.dto.js';
import { BadgeResponseDTO } from '../dto/response/badge.response.dto.js';
import { ListBadgesResponseDTO } from '../dto/response/list-badges.response.dto.js';

@Controller()
export class BadgeQueryController {
  private readonly logger = new Logger({ context: BadgeQueryController.name });

  constructor(
    private readonly badgeService: BadgeService,
    private readonly badgeTransformer: BadgeTransformer,
  ) {}

  @GrpcMethod(BADGE_SERVICE_NAME, BADGE_QUERY_METHODS.GET_BADGES)
  async getBadge(data: GetBadgeQueryDTO): Promise<BadgeResponseDTO> {
    this.logger.log(`gRPC: Getting badge with id: ${data.badgeId}`);
    const badge = await this.badgeService.findById(new BadgeId(data.badgeId));
    return { badge: this.badgeTransformer.toBadgeDTO(badge) };
  }

  @GrpcMethod(BADGE_SERVICE_NAME, BADGE_QUERY_METHODS.GET_BADGE_BY_SLUG)
  async getBadgeBySlug(data: { slug: string }): Promise<BadgeResponseDTO> {
    this.logger.log(`gRPC: Getting badge with slug: ${data.slug}`);
    const badge = await this.badgeService.findBySlug(new BadgeSlug(data.slug));
    return { badge: this.badgeTransformer.toBadgeDTO(badge) };
  }

  @GrpcMethod(BADGE_SERVICE_NAME, BADGE_QUERY_METHODS.LIST_BADGES)
  async listBadges(): Promise<ListBadgesResponseDTO> {
    this.logger.log('gRPC: Listing all badges');
    const badges = await this.badgeService.findAll();
    return { badges: badges.map((b) => this.badgeTransformer.toBadgeDTO(b)) };
  }
}
