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
| `services/ml-model-service/` | FastAPI ML / inference service |
| `docker-compose.yml` | Hai Postgres độc lập (`postgres-platform`, `postgres-ml`), Redis, RabbitMQ, optional `platform` + `ml-model-service` |

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

**Environment:** Copy the repository root `.env.example` to `.env` (includes **`PLATFORM_DB_*`** for Nest and **`ML_DB_*`** for the ML service). Copy or symlink that `.env` to `services/platform/.env` so `ConfigModule` sees the same values when you run the API from `services/platform`.

## Databases (localhost)

Compose chạy **hai container PostgreSQL riêng** (hai volume):

| Service | Mục đích | Port host mặc định |
|---------|----------|---------------------|
| `postgres-platform` | Nest / TypeORM | `5432` → `PLATFORM_DB_PORT` |
| `postgres-ml` | ML projection (`docker/postgres/ml-init`) | `5433` → `ML_DB_PORT` |

```bash
# Chỉ database + Redis + RabbitMQ
docker compose up -d postgres-platform postgres-ml redis rabbitmq

# Kèm API + ML
docker compose up -d
```

Trong `.env` khi chạy app **trên host** (npm / uvicorn): `PLATFORM_DB_HOST=localhost`, `PLATFORM_DB_PORT=5432`, `ML_DB_HOST=localhost`, `ML_DB_PORT=5433` (khớp map cổng của `postgres-ml`).

Biến: `PLATFORM_DB_*` (platform), `ML_DB_*` (ML). Tên `DB_*` cũ vẫn được đọc làm fallback cho platform nếu thiếu `PLATFORM_DB_*`.

Trên localhost bạn có thể bật `synchronize`/bỏ qua migration theo nhu cầu; khi cần migration TypeORM, xem `npm run migration:*` trong `services/platform`.

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
