import { isUUID } from 'class-validator';
import { UserId, UserStatus } from '@volontariapp/domain-user';
import type { UserEntity, UserService } from '@volontariapp/domain-user';

/** Plafond de findByIds cote domain-user (au dela, les ids sont tronques en silence). */
export const MAX_IDS_PER_LOOKUP = 100;

/**
 * Charge les utilisateurs par lots (un seul appel findByIds jusqu'a 100 ids) et
 * restitue le resultat dans l'ordre des ids d'entree. Les ids malformes, introuvables
 * ou en PENDING_DELETION sont ignores, les doublons d'entree sont conserves.
 */
export async function findActiveUsersInOrder(
  userService: Pick<UserService, 'findByIds'>,
  ids: readonly string[],
): Promise<UserEntity[]> {
  const lookupIds = [...new Set(ids.filter((id) => isUUID(id)))];
  const byId = new Map<string, UserEntity>();

  for (let start = 0; start < lookupIds.length; start += MAX_IDS_PER_LOOKUP) {
    const chunk = lookupIds.slice(start, start + MAX_IDS_PER_LOOKUP);
    const found = await userService.findByIds(chunk.map((id) => new UserId(id)));
    for (const user of found) {
      byId.set(user.id, user);
    }
  }

  const ordered: UserEntity[] = [];
  for (const id of ids) {
    const user = byId.get(id);
    if (user !== undefined && user.status !== UserStatus.PENDING_DELETION) {
      ordered.push(user);
    }
  }
  return ordered;
}
