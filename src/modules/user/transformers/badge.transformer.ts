import { Injectable } from '@nestjs/common';
import { BadgeDTO } from '../dto/common/badge.dto.js';
import { BadgeEntity } from '@volontariapp/domain-user';
import { getBadgePoints } from '@volontariapp/shared';
import { BadgeProgressDTO } from '../dto/common/badge-progress.dto.js';
import { TimestampDTO } from '../dto/common/timestamp.dto.js';
import type { BadgeProgressView } from '../services/badge-progress.service.js';
import { UpdateBadgeCommandDTO } from '../dto/request/command/update-badge.command.dto.js';

@Injectable()
export class BadgeTransformer {
  fromBadgeDTO(badgeDTO: BadgeDTO): BadgeEntity {
    const badgeEntity = new BadgeEntity();
    badgeEntity.id = badgeDTO.id;
    badgeEntity.name = badgeDTO.name;
    badgeEntity.slug = badgeDTO.slug;
    badgeEntity.iconPath = badgeDTO.iconPath;
    badgeEntity.description = badgeDTO.description;
    return badgeEntity;
  }

  toBadgeDTO(badgeEntity: BadgeEntity): BadgeDTO {
    const badgeDTO = new BadgeDTO();
    badgeDTO.id = badgeEntity.id;
    badgeDTO.name = badgeEntity.name;
    badgeDTO.slug = badgeEntity.slug;
    badgeDTO.iconPath = badgeEntity.iconPath;
    badgeDTO.description = badgeEntity.description;
    badgeDTO.points = badgeEntity.points ?? getBadgePoints(badgeEntity.slug);
    return badgeDTO;
  }

  toBadgeProgressDTO(view: BadgeProgressView): BadgeProgressDTO {
    const dto = new BadgeProgressDTO();
    dto.slug = view.slug;
    dto.name = view.name;
    dto.description = view.description;
    dto.points = view.points;
    dto.unlocked = view.unlocked;
    dto.awardedAt = view.awardedAt ? this.toTimestampDTO(view.awardedAt) : undefined;
    dto.percent = view.percent;
    dto.requirements = view.requirements.map((r) => ({
      metric: r.metric,
      current: r.current,
      target: r.target,
    }));
    if (view.iconFileId !== undefined) dto.iconFileId = view.iconFileId;
    return dto;
  }

  private toTimestampDTO(date: Date): TimestampDTO {
    const ms = date.getTime();
    const timestamp = new TimestampDTO();
    timestamp.seconds = Math.floor(ms / 1000);
    timestamp.nanos = (ms % 1000) * 1_000_000;
    return timestamp;
  }

  fromUpdateBadgeCommandDTO(dto: UpdateBadgeCommandDTO): Partial<BadgeEntity> {
    const badgeEntity = new BadgeEntity();
    if (dto.name !== undefined && dto.name !== '') badgeEntity.name = dto.name;
    if (dto.slug !== undefined && dto.slug !== '') badgeEntity.slug = dto.slug;
    if (dto.iconPath !== undefined) badgeEntity.iconPath = dto.iconPath;
    if (dto.description !== undefined) badgeEntity.description = dto.description;

    return badgeEntity;
  }
}
