import { Injectable } from '@nestjs/common';
import { BadgeTransformer } from './badge.transformer.js';
import { SignUpInput, UserEntity, UpdateUserInput } from '@volontariapp/domain-user';
import { UserDTO } from '../dto/common/user.dto.js';
import { SignUpCommandDTO } from '../dto/request/command/sign-up.command.dto.js';
import { UserRoles } from '@volontariapp/shared';
import { UpdateUserCommandDTO } from '../dto/request/command/update-user.command.dto.js';

@Injectable()
export class UserTransformer {
  constructor(private readonly badgeTransformer: BadgeTransformer) {}

  fromUserDTO(userDTO: Partial<UserDTO>): UserEntity {
    const userEntity = new UserEntity();
    if (userDTO.id !== undefined && userDTO.id !== '') userEntity.id = userDTO.id;
    if (userDTO.pseudo !== undefined && userDTO.pseudo !== '') userEntity.pseudo = userDTO.pseudo;
    if (userDTO.email !== undefined && userDTO.email !== '') userEntity.email = userDTO.email;
    if (userDTO.bio !== undefined) userEntity.bio = userDTO.bio;
    if (userDTO.role !== undefined) userEntity.role = userDTO.role as UserRoles;
    if (userDTO.logoPath !== undefined) userEntity.logoPath = userDTO.logoPath;
    if (userDTO.totalImpactScore !== undefined)
      userEntity.totalImpactScore = userDTO.totalImpactScore;
    if (userDTO.organisationInfo?.rna !== undefined) userEntity.rna = userDTO.organisationInfo.rna;
    if (userDTO.badges !== undefined)
      userEntity.badges = userDTO.badges.map((badge) => this.badgeTransformer.fromBadgeDTO(badge));

    return userEntity;
  }

  fromSignUpCommandDTO(dto: SignUpCommandDTO): UserEntity {
    const userEntity = new UserEntity();
    userEntity.email = dto.email;
    if (dto.pseudo !== undefined && dto.pseudo !== '') userEntity.pseudo = dto.pseudo;
    if (dto.bio !== undefined) userEntity.bio = dto.bio;
    if (dto.logoPath !== undefined) userEntity.logoPath = dto.logoPath;
    if (dto.organisationInfo !== undefined) userEntity.rna = dto.organisationInfo.rna;

    return userEntity;
  }

  toUserDTO(userEntity: UserEntity): UserDTO {
    const userDTO = new UserDTO();
    userDTO.id = userEntity.id;
    userDTO.email = userEntity.email;
    userDTO.pseudo = userEntity.pseudo;
    userDTO.role = userEntity.role;
    if (userEntity.bio !== undefined) userDTO.bio = userEntity.bio;
    if (userEntity.logoPath !== undefined) userDTO.logoPath = userEntity.logoPath;
    userDTO.totalImpactScore = userEntity.totalImpactScore;
    if (userEntity.rna !== undefined) userDTO.organisationInfo = { rna: userEntity.rna };
    userDTO.badges = userEntity.badges.map((badge) => this.badgeTransformer.toBadgeDTO(badge));

    return userDTO;
  }

  toSignUpInput(command: SignUpCommandDTO): SignUpInput {
    const signUpInput = new SignUpInput(
      command.email,
      command.password,
      command.pseudo,
      command.bio,
      command.logoPath,
      command.organisationInfo?.rna,
    );
    return signUpInput;
  }

  toUpdateUserInput(dto: UpdateUserCommandDTO): UpdateUserInput {
    return new UpdateUserInput({
      pseudo: dto.pseudo,
      bio: dto.bio,
      logoPath: dto.logoPath,
      rna: dto.organisationInfo?.rna,
      previousPassword: dto.previousPassword,
      newPassword: dto.newPassword,
    });
  }
}
