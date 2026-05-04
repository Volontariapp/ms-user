import { UserEntity } from '@volontariapp/domain-user';
import { UserRoles } from '@volontariapp/shared';

export class UserFactory {
  static create(overrides?: Partial<UserEntity>): UserEntity {
    const user = new UserEntity();
    user.id = overrides?.id ?? '123e4567-e89b-12d3-a456-426614174000';
    user.email = overrides?.email ?? 'test@example.com';
    user.pseudo = overrides?.pseudo ?? 'testuser';
    user.role = overrides?.role ?? UserRoles.VOLUNTEER;
    user.bio = overrides?.bio ?? undefined;
    user.logoPath = overrides?.logoPath ?? undefined;
    user.totalImpactScore = overrides?.totalImpactScore ?? 0;
    user.badges = overrides?.badges ?? [];

    return user;
  }

  static createAdmin(overrides?: Partial<UserEntity>): UserEntity {
    return UserFactory.create({ ...overrides, role: UserRoles.ADMIN });
  }
}
