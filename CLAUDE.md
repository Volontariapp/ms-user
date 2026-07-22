## Domaine ms-user

Agrégats : `UserEntity` (email, pseudo, role, rna, bio, logoPath, totalImpactScore, badges,
passwordHash) et `BadgeEntity` (name, slug, description, iconPath). Rôles: VOLUNTEER (défaut),
ORGANIZATION (si `rna` fourni), ADMIN. La logique métier vit dans `@volontariapp/domain-user`
(npm-packages/packages/domain-user), pas dans ms-user lui-même : `AuthService`, `UserService`,
`BadgeService`, repositories Postgres.

Règles métier notables (domain-user):

- `rna` doit matcher `^W[0-9]{9}$` sinon `INVALID_RNA`; sinon trim + uppercase.
- Présence de `rna` => role ORGANIZATION, sinon VOLUNTEER par défaut à la création.
- `pseudo` généré aléatoirement (adjectif+nom+3 chiffres) si absent.
- Mot de passe hashé via `@volontariapp/crypto` (`hashPassword`/`verifyPassword`), jamais stocké/loggé en clair.
- Emails jamais loggés en clair : les logs utilisent `calculateHash(email).slice(0, 8)`.
- Update de mot de passe exige `previousPassword` vérifié (`WRONG_PASSWORD` sinon).
- `incrementImpactScore` refuse les incréments <= 0 (`INVALID_SCORE_INCREMENT`).
- Auth JWT via `@volontariapp/auth` (`JwtService`), access + refresh tokens signés en parallèle.

## Événements outbox

- Émis: `user.created` — inséré dans `event_queue` par un trigger SQL Postgres
  (`users_created_event_queue_trigger`, voir domain-user `src/database/triggers/index.ts` et
  migration `1780000000000-SetupUserTriggers.ts`), emitter `ms-user`, target_services `['social:user']`,
  payload `{ after: { id, role } }`.
- ms-user ne consomme aucun event_queue (pas de consumer/listener trouvé dans src/).
- Utilise `jobs_outbox` en pattern de fallback/compensation (pas en émission d'event métier) :
  `BaseCommandController.withFallback` pousse un job (`UserJobType.FALLBACK_*`, queue
  `UserQueue.FALLBACK_USER`) quand une commande gRPC échoue pour une raison non-4xx (UpdateUser,
  DeleteUser, AddBadgeToUser, RemoveBadgeFromUser, IncrementImpactScore).

## gRPC exposé (proto-registry/proto/volontariapp/user)

`UserService`: GetUser, GetPublicUser, GetUsersByIds, ListUsers, SignUp, UpdateUser, DeleteUser,
AdminGetUser, AdminUpdateUser, AdminDeleteUser, Login, RefreshToken, IncrementImpactScore,
AddBadgeToUser, RemoveBadgeFromUser, GetMyFollowsProfiles, GetMyFollowersProfiles,
GetEventParticipantsProfiles, GetPostLikersProfiles.
`BadgeService`: CreateBadge, UpdateBadge, DeleteBadge, GetBadge, ListBadges, GetBadgeBySlug.

Controllers: `src/modules/user/controllers/command/{user,badge}.command.controller.ts` et
`controllers/queries/{user,badge}.query.controller.ts`. Les mutations sensibles (UpdateUser,
DeleteUser, AddBadgeToUser, ...) sont protégées par `GrpcInternalGuard` + `@CurrentUser()`.

## Clients gRPC sortants

ms-user consomme en synchrone (queries) d'autres services via `ClientGrpc` sur le package
`SOCIAL_PACKAGE` : `social-relationship.query-client.ts` (GetMyFollows/GetMyFollowers),
`social-interaction.query-client.ts`, `social-participation.query-client.ts`
(src/modules/user/clients/).

## Package partagé

`@volontariapp/domain-user` (npm-packages/packages/domain-user) : entités, value-objects,
repositories Postgres, `AuthService`/`UserService`/`BadgeService`, migrations et triggers SQL
partagés (aussi dupliqués dans `src/migrations/` de ms-user).

---

## 🚀 RTK - Rust Token Killer (Optimized)

All shell commands (`git`, `npm`, `jest`, etc.) are automatically proxied via `rtk` for 80% token savings.

- **Direct Usage:** `rtk gain` (analytics), `rtk discover` (missed savings).
- **Files:** Use `rtk read <file>`, `rtk ls`, `rtk find`, `rtk grep` for compressed agent output.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:

- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
