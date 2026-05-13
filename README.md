<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

Monorepo for the trip recommendation backend and future ML services.

| Path | Role |
|------|------|
| `services/platform/` | NestJS API (main application) |
| `services/ml-model-service/` | Placeholder for ML / inference (to be implemented) |
| `docker-compose.yml` | Local Postgres + Redis |

## Project setup (API)

All `npm` commands for the API run from `services/platform`:

```bash
cd services/platform
npm install
```

## Compile and run the API

```bash
cd services/platform

# development
npm run start

# watch mode
npm run start:dev

# production mode
npm run start:prod
```

**Environment:** Copy the repository root `.env.example` to `.env` for Docker Compose variables, and copy or symlink it to `services/platform/.env` so `ConfigModule` (which loads `.env` from the process working directory) sees the same values when you run the API from `services/platform`.

## Database migrations (local)

Run migrations locally even when using a local database so your schema/indexes stay aligned with the codebase (especially catalog search and PostGIS/query-performance indexes).

### 1) Start local services

```bash
# From repository root — postgres + redis
docker compose up -d

# or postgres only
docker compose up -d postgres
```

### 2) Ensure environment variables are set

Required DB vars in `.env`:

- `DB_HOST`
- `DB_PORT`
- `DB_USERNAME`
- `DB_PASSWORD`
- `DB_DATABASE`

### 3) Run migration command

Run all pending migrations:

```bash
cd services/platform
npm run migration:run
```

Useful migration commands (from `services/platform`):

```bash
npm run migration:show
npm run migration:revert
npm run migration:create
```

The migration CLI uses a dedicated CommonJS datasource (build step runs automatically, migrations run from `dist`):

- `services/platform/src/core/database/typeorm.datasource.cjs`

Source datasource file:

- `services/platform/src/core/database/typeorm.datasource.ts`

Reference migration file:

- `services/platform/src/core/database/migrations/1760000002000-OptimizePlaceCatalogSearchIndexes.ts`

### 4) Verify migration results

```sql
SELECT extname FROM pg_extension WHERE extname = 'pg_trgm';

SELECT indexname
FROM pg_indexes
WHERE tablename IN ('places', 'place_categories')
ORDER BY indexname;
```

### Why this matters in local

- Keeps local query plans consistent with team/staging environments.
- Avoids false performance conclusions during `EXPLAIN ANALYZE`.
- Ensures catalog keyword search (`ILIKE`) uses the intended trigram index path.

## Run tests

```bash
cd services/platform

npm run test
npm run test:e2e
npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
