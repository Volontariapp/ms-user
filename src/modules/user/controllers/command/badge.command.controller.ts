import { Controller } from '@nestjs/common';
import { GrpcMethod, Payload } from '@nestjs/microservices';
import { BADGE_COMMAND_METHODS, BADGE_SERVICE_NAME } from '@volontariapp/contracts-nest';
import { BadgeId, BadgeService, CreateBadgeInput } from '@volontariapp/domain-user';
import { BadgeTransformer } from '../../transformers/badge.transformer.js';
import { CreateBadgeCommandDTO } from '../../dto/request/command/create-badge.command.dto.js';
import { UpdateBadgeCommandDTO } from '../../dto/request/command/update-badge.command.dto.js';
import { DeleteBadgeCommandDTO } from '../../dto/request/command/delete-badge.command.dto.js';
import { BadgeResponseDTO } from '../../dto/response/badge.response.dto.js';
import { UserJobType } from '@volontariapp/messaging';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BaseCommandController } from './base.command.controller.js';

@Controller()
export class BadgeCommandController extends BaseCommandController {
  constructor(
    private readonly badgeService: BadgeService,
    private readonly badgeTransformer: BadgeTransformer,
    @InjectDataSource() dataSource: DataSource,
  ) {
    super(dataSource);
  }

  @GrpcMethod(BADGE_SERVICE_NAME, BADGE_COMMAND_METHODS.CREATE_BADGE)
  async createBadge(@Payload() data: CreateBadgeCommandDTO): Promise<BadgeResponseDTO> {
    return this.withFallback(UserJobType.FALLBACK_CREATE_BADGE, 'system', data, async () => {
      this.logger.log(`gRPC: Creating badge with slug: ${data.slug}`);
      const badge = await this.badgeService.create(
        new CreateBadgeInput(data.name, data.slug, data.description, data.iconPath),
      );
      return { badge: this.badgeTransformer.toBadgeDTO(badge) };
    });
  }

  @GrpcMethod(BADGE_SERVICE_NAME, BADGE_COMMAND_METHODS.UPDATE_BADGE)
  async updateBadge(@Payload() data: UpdateBadgeCommandDTO): Promise<BadgeResponseDTO> {
    return this.withFallback(UserJobType.FALLBACK_UPDATE_BADGE, 'system', data, async () => {
      this.logger.log(`gRPC: Updating badge with id: ${data.badgeId}`);
      const partial = this.badgeTransformer.fromUpdateBadgeCommandDTO(data);
      const badge = await this.badgeService.update(new BadgeId(data.badgeId), partial);
      return { badge: this.badgeTransformer.toBadgeDTO(badge) };
    });
  }

  @GrpcMethod(BADGE_SERVICE_NAME, BADGE_COMMAND_METHODS.DELETE_BADGE)
  async deleteBadge(@Payload() data: DeleteBadgeCommandDTO): Promise<void> {
    return this.withFallback(UserJobType.FALLBACK_DELETE_BADGE, 'system', data, async () => {
      this.logger.log(`gRPC: Deleting badge with id: ${data.badgeId}`);
      await this.badgeService.delete(new BadgeId(data.badgeId));
    });
  }
}
