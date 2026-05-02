import { Injectable } from '@nestjs/common';
import { BadgeDTO } from '../dto/common/badge.dto.js';
import { BadgeEntity } from '@volontariapp/domain-user';
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
    return badgeDTO;
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
