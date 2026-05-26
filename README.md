# 👤 Volontariapp - User Microservice (`ms-user`)

[![NestJS](https://img.shields.io/badge/framework-NestJS-red.svg)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/language-TypeScript-blue.svg)](https://www.typescriptlang.org/)
[![gRPC](https://img.shields.io/badge/protocol-gRPC-green.svg)](https://grpc.io/)
[![GitNexus](https://img.shields.io/badge/intelligence-GitNexus-orange.svg)](https://gitnexus.vercel.app/)

Welcome to the **User Microservice** of the Volontariapp ecosystem. This service is responsible for managing user profiles, authentication metadata, and platform-wide user-related data.

---

## 🧠 Code Intelligence with GitNexus

This project uses **GitNexus** to maintain a live knowledge graph of the codebase. This allows for safe refactoring, deep impact analysis, and easier onboarding.

### 🚀 Visualization

To see the codebase graph:

1. Run `npx gitnexus serve`
2. Visit [https://gitnexus.vercel.app/](https://gitnexus.vercel.app/)

### 🛠️ Key Commands

- **Analyze Repo**: `npx gitnexus analyze` (Run after major changes)
- **Status Check**: `npx gitnexus status`
- **Impact Analysis**: `npx gitnexus impact <SymbolName>`

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- Yarn
- Docker (for database dependencies)

### Installation

```bash
yarn install
```

### Running the App

```bash
# Development mode
yarn run start:dev

# Production mode
yarn run start:prod
```

### Running Tests

```bash
# Unit tests
yarn run test

# Integration tests
yarn run test:int

# E2E tests
yarn run test:e2e
```

---

## 🏗️ Architecture

This microservice follows a clean architecture pattern with a focus on domain-driven design:

- **Controllers**: Entry points for gRPC/HTTP requests.
- **Services**: Business logic and orchestration.
- **Mappers**: Data transformation between layers (Entity <-> DTO).
- **Repositories**: Data access abstraction using Sequelize.

---

## 📜 License

This project is [MIT licensed](LICENSE).
