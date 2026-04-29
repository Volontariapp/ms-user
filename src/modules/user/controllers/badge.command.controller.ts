import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { BADGE_COMMAND_METHODS } from '@volontariapp/contracts-nest';
import { Logger } from '@volontariapp/logger';
import {
  BadgeId,
  BadgeService,
  CreateBadgeInput,
  UpdateBadgeInput,
} from '@volontariapp/domain-user';
import { BadgeTransformer } from '../transformers/badge.transformer.js';
import { CreateBadgeCommandDTO } from '../dto/request/command/create-badge.command.dto.js';
import { UpdateBadgeCommandDTO } from '../dto/request/command/update-badge.command.dto.js';
import { DeleteBadgeCommandDTO } from '../dto/request/command/delete-badge.command.dto.js';
import { BadgeResponseDTO } from '../dto/response/badge.response.dto.js';

const BADGE_SERVICE_NAME = 'BadgeService';

@Controller()
export class BadgeCommandController {
  private readonly logger = new Logger({
    context: BadgeCommandController.name,
  });

  constructor(
    private readonly badgeService: BadgeService,
    private readonly badgeTransformer: BadgeTransformer,
  ) {}

  @GrpcMethod(BADGE_SERVICE_NAME, BADGE_COMMAND_METHODS.CREATE_BADGE)
  async createBadge(data: CreateBadgeCommandDTO): Promise<BadgeResponseDTO> {
    this.logger.log(`gRPC: Creating badge with slug: ${data.slug}`);
    const badge = await this.badgeService.create(
      new CreateBadgeInput(
        data.name,
        data.slug,
        data.description,
        data.iconPath,
      ),
    );
    return { badge: this.badgeTransformer.toBadgeDTO(badge) };
  }

  @GrpcMethod(BADGE_SERVICE_NAME, BADGE_COMMAND_METHODS.UPDATE_BADGE)
  async updateBadge(data: UpdateBadgeCommandDTO): Promise<BadgeResponseDTO> {
    this.logger.log(`gRPC: Updating badge with id: ${data.badgeId}`);
    const badge = await this.badgeService.update(
      new BadgeId(data.badgeId),
      new UpdateBadgeInput({
        name: data.name,
        slug: data.slug,
        iconPath: data.iconPath,
        description: data.description,
      }),
    );
    return { badge: this.badgeTransformer.toBadgeDTO(badge) };
  }

  @GrpcMethod(BADGE_SERVICE_NAME, BADGE_COMMAND_METHODS.DELETE_BADGE)
  async deleteBadge(data: DeleteBadgeCommandDTO): Promise<void> {
    this.logger.log(`gRPC: Deleting badge with id: ${data.badgeId}`);
    await this.badgeService.delete(new BadgeId(data.badgeId));
  }
}
