# Microservice User (ms-user)

## Project Overview & Value Proposition

Le microservice **`ms-user`** est responsable de la gestion de l'identité et des profils au sein de l'écosystème Volontariapp. Conçu comme un service backend pur et headless, il ne communique avec l'extérieur qu'au travers de contrats d'interface stricts (gRPC).

Sa proposition de valeur réside dans l'isolation des données utilisateur (Single Source of Truth des profils) et dans sa scalabilité indépendante. Il reçoit des requêtes pré-validées et pré-authentifiées par l'API Gateway via un token interne sécurisé, ce qui lui permet de se concentrer exclusivement sur la logique métier propre au cycle de vie de l'utilisateur, tout en garantissant la cohérence des données via le pattern Outbox.

## Key Features

- **Gestion des Identités et Profils** : Création, mise à jour et lecture des profils utilisateurs.
- **Communication gRPC Hautes Performances** : Exposition des endpoints RPC définis dans le registre de contrats (`proto-registry`).
- **Délégation de l'Autorisation** : S'appuie sur le token interne généré par l'API Gateway (qui gère le RBAC) pour le contexte d'exécution de la requête.
- **Publication d'Événements (Outbox Pattern)** : Enregistrement transactionnel des événements de domaine (ex: `UserCreated`) qui seront ensuite propagés de manière asynchrone par les `outbox-runners`.
- **Réutilisabilité Métier (DRY)** : S'appuie entièrement sur le module isolé `@volontariapp/domain-user` pour la logique métier, les entités et les dépôts de données.

## Tech Stack & Dependencies

| Composant                 | Technologie                     | Usage / Rôle                                                       |
| :------------------------ | :------------------------------ | :----------------------------------------------------------------- |
| **Framework Base**        | NestJS                          | Injection de dépendances et orchestration des modules.             |
| **Logique Métier**        | `@volontariapp/domain-user`     | Paquet interne contenant les entités DDD et cas d'usage.           |
| **Persistance**           | PostgreSQL & TypeORM            | Stockage relationnel robuste pour les données de profil.           |
| **Messagerie Asynchrone** | BullMQ / `@volontariapp/outbox` | Implémentation du pattern Outbox pour l'Event-Driven Architecture. |
| **Communication RPC**     | gRPC (`@grpc/grpc-js`)          | Serveur RPC pour recevoir les requêtes de l'API Gateway.           |

## Getting Started

### Prérequis

- **Node.js** (>= 24.14.0)
- **Package Manager** : Yarn v4 (`corepack enable`)
- Infrastructure de base de données (PostgreSQL) et de cache/queue (Redis) accessibles.

### Installation

```bash
cd ms-user
yarn install
```

### Configuration (.env)

Les variables d'environnement nécessaires incluent les informations de connexion à PostgreSQL (via TypeORM), les accès à l'instance Redis (pour BullMQ), et la configuration du port gRPC (généralement 50051 en local).

### Commandes d'Exécution

```bash
# Mode développement avec Hot-Reload
yarn start:dev

# Génération et application des migrations de base de données
yarn migration:generate
yarn migration:run:dev
```

## Testing

Le microservice s'appuie sur une infrastructure de test conteneurisée gérée centralement.

- **Tests Unitaires et d'Intégration** : Effectués en grande partie au sein du monorepo `npm-packages` dans le périmètre du `@volontariapp/domain-user`.
- **Tests End-to-End (E2E)** : Requiert le provisionnement de l'infrastructure via le sous-module **`ci-tools`** (qui déploie des conteneurs PostgreSQL et Redis éphémères pour garantir l'isolation et la reproductibilité des tests).

```bash
yarn test:e2e
```

## CI/CD & Deployment

- **Containerisation** : L'application est buildée sous forme d'image OCI via un `Dockerfile` optimisé multi-stage.
- **Continuous Integration** : Exécutée par GitHub Actions, validant le linting, les tests E2E et la construction de l'image.
- **Déploiement** : Opéré de manière déclarative (GitOps) sans contraintes spécifiques de multi-tenancy ou de sharding au niveau de la base de données.
