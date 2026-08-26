# 🧾 Changelog

All notable changes in this project will be documented in this file.


## [3.4.1](https://github.com/omnixys/event-service/compare/v3.4.0...v3.4.1) (2026-08-26)

### Deps

* **Deps:** update logger to 3.2.6 ([](https://github.com/omnixys/event-service/commit/5ba2f05f14d99827b3029d351d8ab68f87304dcf))
* **Deps:** update shared TypeScript packages ([](https://github.com/omnixys/event-service/commit/9782d7f3e2e47fb79fef3a67c9f007423548d3e0))

## [3.4.0](https://github.com/omnixys/event-service/compare/v3.3.3...v3.4.0) (2026-08-26)

### Deps

* **Deps:** update omnixys ts packages ([](https://github.com/omnixys/event-service/commit/f9517c5f227759914ac80ade189fe39e108c1b0c))

### Event

* **Event:** allow admin realm role for rbac resolvers ([](https://github.com/omnixys/event-service/commit/46956e411ae4de14cf62c2ffaf19db995fc93aec))

### Otel

* **Otel:** add otel logs ([](https://github.com/omnixys/event-service/commit/4b55257be94ad070fd137d453cf3be54672b6dbb))

## [3.3.3](https://github.com/omnixys/event-service/compare/v3.3.2...v3.3.3) (2026-08-23)

### Logger

* **Logger:** fix terminal logger ([](https://github.com/omnixys/event-service/commit/571d49b701ed9cd9c166934caae2c5d1dffd9d79))

## [3.3.2](https://github.com/omnixys/event-service/compare/v3.3.1...v3.3.2) (2026-08-23)

### Observability

* **Observability:** update dependency ([](https://github.com/omnixys/event-service/commit/7e0abfb786d976938f8f3062ed3657b7bdb6178e))

## [3.3.1](https://github.com/omnixys/event-service/compare/v3.3.0...v3.3.1) (2026-08-19)

### Agent

* **Agent:** add repository development instructions ([](https://github.com/omnixys/event-service/commit/fb7c2150310ea6228a1a187383bcafe23fe0c399))

### Build

* **Build:** replace invalid rateLimit skip with allowList and fix lint/format config ([](https://github.com/omnixys/event-service/commit/54be46aab71f9a178fe08e715870798f1e631c44))

### Event

* **Event:** exclude health endpoints from rate-limit and bump version ([](https://github.com/omnixys/event-service/commit/8d23379acccbc69141a2840f65fe19161bbebe1a))

## [3.3.0](https://github.com/omnixys/event-service/compare/v3.2.0...v3.3.0) (2026-08-03)

### Analytics

* **Analytics:** publish event lifecycle facts via outbox ([](https://github.com/omnixys/event-service/commit/d99c118f6d3f76bf153b258b8152a8f86ee7a397))

### Config

* **Config:** require and validate DEFAULT_TENANT_ID ([](https://github.com/omnixys/event-service/commit/ef040db20a3546c62fd9139634bea6cc778effce))
* **Config:** support trusted proxy address policy ([](https://github.com/omnixys/event-service/commit/4fc8371f254d89a70bae927b3ad8acec6eb56a29))

### Errors

* **Errors:** adopt secure event error handling ([](https://github.com/omnixys/event-service/commit/cb46802e4c0b3cb53162e21555b326281dcf225d))

### Tenant

* **Tenant:** use DEFAULT_TENANT_ID instead of hardcoded 'omnixys' ([](https://github.com/omnixys/event-service/commit/178810c41a5c722eb2af849539bf9288d38361af))

## [3.2.0](https://github.com/omnixys/event-service/compare/v3.1.0...v3.2.0) (2026-07-28)

### Event

* **Event:** add logging to event-access, media, and media-processing services ([](https://github.com/omnixys/event-service/commit/90a7d70e6913b9c218c3676b4401089c7d348957))
* **Event:** add structured logging to EventMutationResolver ([](https://github.com/omnixys/event-service/commit/1eae8fb837114ac6979bbabcee2704e0d80af7f3))

### Log

* **Log:** resolve build errors in media and event-access services ([](https://github.com/omnixys/event-service/commit/4e27f959d1f36047168e131c325b7027017e0c42))

### Prisma

* **Prisma:** add generated prisma files ([](https://github.com/omnixys/event-service/commit/2e8cd3102fe2cda94f078e82ff19342e4f69641a))

## [3.1.0](https://github.com/omnixys/event-service/compare/v3.0.1...v3.1.0) (2026-07-24)

### Deps

* **Deps:** remove obsolete/redundant dependencies ([](https://github.com/omnixys/event-service/commit/bac75724e37b942c27fdf44a0bebd84cd2335d61))

### Event

* **Event:** resolve staff permissions via RBAC instead of returning empty array ([](https://github.com/omnixys/event-service/commit/0dfae9ea17e18ec885101d6639b48890fbcd4867))

### Log

* **Log:** remove logstream dep ([](https://github.com/omnixys/event-service/commit/fac1f643a5e5dbfc5339a8f34ab144e4e238b451))

### Logger

* **Logger:** remove Kafka log transport config ([](https://github.com/omnixys/event-service/commit/04f752a5097513e37556833432d37ddf3658e52f))

### Other

* **Other:** resolve lint errors in user-projection.service ([](https://github.com/omnixys/event-service/commit/03f7dc06f8e45cd4b0af840dfa9704defd9c60d5))
* **Other:** fix(fix):Update package.json ([](https://github.com/omnixys/event-service/commit/57e5d1a756b3b398566e429c2734de0316745704))

### Prisma

* **Prisma:** add user projection table ([](https://github.com/omnixys/event-service/commit/659270b6fdd3e7a09c539111387e5cbf2fcdfbfb))

## [3.0.1](https://github.com/omnixys/event-service/compare/v3.0.0...v3.0.1) (2026-07-17)

### Deps

* **Deps:** Update package.json ([](https://github.com/omnixys/event-service/commit/8c44b19baa351fb9a4452b4f833973d0d0ed6029))

## [3.0.0](https://github.com/omnixys/event-service/compare/v2.1.0...v3.0.0) (2026-07-16)

### New

* **New:** new service ([](https://github.com/omnixys/event-service/commit/4afa596fb76fffa014e54f3ce58330d8ebac3c18))
* **New:** new service ([](https://github.com/omnixys/event-service/commit/490cc62c44ee2fd1f038464f8b7ac68b66daa2b7))

## [2.1.0](https://github.com/omnixys/event-service/compare/v2.0.4...v2.1.0) (2026-07-02)

### Deps

* **Deps:** update dependencys ([](https://github.com/omnixys/event-service/commit/90002b3d71d9ba06c51d80abc3c708362128606a))

### Other

* **Other:** Merge branch 'main' of https://github.com/omnixys/event-service ([](https://github.com/omnixys/event-service/commit/52e26f8179c69a9c38b0bc9e476051e64a4cbdb9))

## [2.0.4](https://github.com/omnixys/event-service/compare/v2.0.3...v2.0.4) (2026-07-01)

### Other

* **Other:** Merge branch 'main' of https://github.com/omnixys/event-service ([](https://github.com/omnixys/event-service/commit/7ee5bfa1fd5cf47054e4de7084fe4a52e24f11a7))

### RSVP

* **RSVP:** fix for public RSVP ([](https://github.com/omnixys/event-service/commit/4b0bb7ade25300c0de2d6e9ec152514451d28cf1))

## [2.0.3](https://github.com/omnixys/event-service/compare/v2.0.2...v2.0.3) (2026-06-29)

### Other

* **Other:** Merge branch 'main' of https://github.com/omnixys/event-service ([](https://github.com/omnixys/event-service/commit/762b2f8fa9fb2fd38b3fa81b9886aa061859738e))

### Storage

* **Storage:** remove healthcheck ([](https://github.com/omnixys/event-service/commit/25ae60c18a5cfdf456a1747dc837c288034eb124))

## [2.0.2](https://github.com/omnixys/event-service/compare/v2.0.1...v2.0.2) (2026-06-29)

### Media

* **Media:** update dependency ([](https://github.com/omnixys/event-service/commit/f80e75e9d75d9eb79a6d7d71af849668d22cd746))

## [2.0.1](https://github.com/omnixys/event-service/compare/v2.0.0...v2.0.1) (2026-06-29)

### Kafka

* **Kafka:** update kafka dependency ([](https://github.com/omnixys/event-service/commit/f8e40dc47dbcf09fd054d52a222dc25dcf18e369))

### Other

* **Other:** Merge branch 'main' of https://github.com/omnixys/event-service ([](https://github.com/omnixys/event-service/commit/5c9fa0592d9b74e103130d89f0927d6e8ab3fa2f))

## [2.0.0](https://github.com/omnixys/event-service/compare/v1.0.4...v2.0.0) (2026-06-28)

### Dependencies

* **Dependencies:** update Dependecies ([](https://github.com/omnixys/event-service/commit/c14de81f11336ca2004a38768d7c494f2b297f01))

### Event

* **Event:** harden context media and lifecycle flows ([](https://github.com/omnixys/event-service/commit/2209dba2c3bfef93ba4e94acd4b7b69660997141))

### Other

* **Other:** Merge branch 'main' of https://github.com/omnixys/event-service ([](https://github.com/omnixys/event-service/commit/79878a32e5aa27857ff077a0ee418be17a3c10d8))

## [1.0.4](https://github.com/omnixys/event-service/compare/v1.0.3...v1.0.4) (2026-05-25)

### Docker

* **Docker:** Dockerfile ([](https://github.com/omnixys/event-service/commit/cea469f7b47c4db6c55375dfe9f27848d8eef1a9))

### Other

* **Other:** Merge branch 'main' of https://github.com/omnixys/event-service ([](https://github.com/omnixys/event-service/commit/586b5b625fb4b2ac01b69587f90f636a9ff0b257))

## [1.0.3](https://github.com/omnixys/event-service/compare/v1.0.2...v1.0.3) (2026-05-24)

### Graphql

* **Graphql:** add explicit type for the "updatedAt" ([](https://github.com/omnixys/event-service/commit/578df2b2d16acaa10bf3a621c03085a975934ae3))

### Other

* **Other:** Merge branch 'main' of https://github.com/omnixys/event-service ([](https://github.com/omnixys/event-service/commit/f956eddf7221e9b2ce6b27ca03888a6cb3eb7855))

## [1.0.2](https://github.com/omnixys/event-service/compare/v1.0.1...v1.0.2) (2026-05-24)

### Prisma

* **Prisma:** debug ([](https://github.com/omnixys/event-service/commit/1f22f29a0aa572a5864f75fd7c628d78a9ac37c1))

## [1.0.1](https://github.com/omnixys/event-service/compare/v1.0.0...v1.0.1) (2026-05-24)

### Docker

* **Docker:** update pnpm version ([](https://github.com/omnixys/event-service/commit/29c258e9985d8e570d095498a38f05399118d6f2))

### Prisma

* **Prisma:** update prisma schema ([](https://github.com/omnixys/event-service/commit/2277829c09e0d8f1788878e0cf5017c2ff875ae5))

## 1.0.0 (2026-05-01)

### ⚠ BREAKING CHANGE

* **Media:** - image processing now uses Buffer instead of ReadableStream
- all services updated to use in-memory processing pipeline

### Ci

* **Ci:** change serets.SERVICE to vars.SERVICE ([](https://github.com/omnixys/event-service/commit/c57204b47d1a629517534ea6097d61d04b5219c2))
* **Ci:** update CI ([](https://github.com/omnixys/event-service/commit/5c091f54ce01038fea424923b71cf82af2ee8942))

### Create

* **Create:** finished flow ([](https://github.com/omnixys/event-service/commit/7708be2ea293adee592de87c9195642d8fd358f1))

### Enum

* **Enum:** add enum ([](https://github.com/omnixys/event-service/commit/a5a5c51aac3527ec266324bca699177a8d3f7b4c))
* **Enum:** fix CannotDetermineOutputTypeError: ([](https://github.com/omnixys/event-service/commit/4581aec7dce9ba12161738a3dd8c5b93ee7f6fc8))

### Event

* **Event:** Event hierarchy and Valkey rate-limiter ([](https://github.com/omnixys/event-service/commit/363eb51e17f33fc7ef84cabaefc4fc55aac4c0d9))

### Event-service

* **Event-service:** implement EventService logic and GraphQL resolvers ([](https://github.com/omnixys/event-service/commit/a53ef7b42c3ccab619897fc57441642b6a644007))
* **Event-service:** implement EventService logic and GraphQL resolvers ([](https://github.com/omnixys/event-service/commit/aa8c0c00e13d212f5f72071b2495f3ed89bf01fd))
* **Event-service:** implement GraphQL schema, DTOs, inputs and payloads ([](https://github.com/omnixys/event-service/commit/4d4873981a4e1a152721a7a2775642f89e7e5171))
* **Event-service:** initialize project structure and base configuration ([](https://github.com/omnixys/event-service/commit/8afe9f7020709b1b8150727fcd9d08332c47e2af))
* **Event-service:** set up PostgreSQL database, schema and Prisma models ([](https://github.com/omnixys/event-service/commit/3d0c8f52360a74bdf812dc1f1fa8831e1f1b789d))

### Input

* **Input:** change create event input ([](https://github.com/omnixys/event-service/commit/f4b6993a90e48728bdc0fde470533e5d9c4057d2))

### Media

* **Media:** add image processing pipeline with automatic variant generation ([](https://github.com/omnixys/event-service/commit/586aa7e6b32eab65f87d4629bb2ff2e2457dcde4))
* **Media:** implement secure file upload flow with storage integration ([](https://github.com/omnixys/event-service/commit/3bf6b1c000a9ce3872bfe98a48c8e1825cf5318a))

### Other

* **Other:** workflow completed ([](https://github.com/omnixys/event-service/commit/cc8adcc9571b6265844920b618092a3646b760af))
* **Other:** add CI ([](https://github.com/omnixys/event-service/commit/3a794464df1bf69c8f1fd84f2bfd4cd39aa62446))
* **Other:** add Database ([](https://github.com/omnixys/event-service/commit/4bde3cf3d1fd0ac92bf06cf314a38de3013a64fc))
* **Other:** add tests ([](https://github.com/omnixys/event-service/commit/f01efab45c726c69eb96174922fb10678ec94588))
* **Other:** breaking:(1.0.0): unify workflows and remove legacy tests ([](https://github.com/omnixys/event-service/commit/9a91a270f012c2abddc8bd5d02bc185e490ade13))
* **Other:** Create deploy.yml ([](https://github.com/omnixys/event-service/commit/44b30e470fe79e772eb6758e0d04d9388a4397cf))
* **Other:** Merge branch '4-event-task-implement-eventservice-logic-and-graphql-resolvers' ([](https://github.com/omnixys/event-service/commit/3a97f3d6a88a2c2e979cb6d48381c14188d5f8b9))
* **Other:** Merge branch 'main' of https://github.com/omnixys/omnixys-event-service ([](https://github.com/omnixys/event-service/commit/d519579c2f6f86a40c0d399460affac6f9b2e921))
* **Other:** Merge branch 'main' of https://github.com/omnixys/omnixys-event-service ([](https://github.com/omnixys/event-service/commit/1f6f0fc9d9db31be1ed6887d0dd331494beb56a2))
* **Other:** Merge pull request #5 from omnixys/1-event-task-initialize-event-service-project-structure-and-configuration ([](https://github.com/omnixys/event-service/commit/a44bd0669b4f26734fe141bb21ba1bda338d1e9e)), closes [#5](https://github.com/omnixys/event-service/issues/5)
* **Other:** Merge pull request #6 from omnixys/2-event-task-create-postgresql-user-database-and-initial-schema-for-the-event-service ([](https://github.com/omnixys/event-service/commit/0b8f2756e01154cb35c6f5e8ef29c3ace8d8c0d0)), closes [#6](https://github.com/omnixys/event-service/issues/6)
* **Other:** Merge pull request #7 from omnixys/3-event-task-implement-graphql-schema-entities-inputs-dtos-and-payloads-for-event-service ([](https://github.com/omnixys/event-service/commit/a7347a5c675408306b83f298b84ff56b6ae04bcd)), closes [#7](https://github.com/omnixys/event-service/issues/7)
* **Other:** Merge pull request #8 from omnixys/4-event-task-implement-eventservice-logic-and-graphql-resolvers ([](https://github.com/omnixys/event-service/commit/738842b3817bb09d366fc299f77a88ec4df8ac9d)), closes [#8](https://github.com/omnixys/event-service/issues/8)
* **Other:** Update docker-build.yaml ([](https://github.com/omnixys/event-service/commit/124b0b3623fcd11707c5ad38039c4db8f317efd1))
* **Other:** Update docker-build.yaml ([](https://github.com/omnixys/event-service/commit/8ae481dec25508c009a49278ec80bf0f3d239988))
* **Other:** Update docker-build.yaml ([](https://github.com/omnixys/event-service/commit/ab10892be66012b1d34001453c8c8eb25f167240))
* **Other:** Update docker-build.yaml ([](https://github.com/omnixys/event-service/commit/ab269a12d9518cc00d0ea9bdeb558dc9f9074859))
* **Other:** Update docker-build.yaml ([](https://github.com/omnixys/event-service/commit/ddd5be905917a0b0ad09a768a4fb7295089548b4))
* **Other:** Update docker-build.yaml ([](https://github.com/omnixys/event-service/commit/60f12f29177d1117c3b710b4ac12645de8c96ecc))
* **Other:** update DockerFile ([](https://github.com/omnixys/event-service/commit/b0dd5aa1f05134f1198548912c2034d373f2b765))
* **Other:** Update Dockerfile ([](https://github.com/omnixys/event-service/commit/2b6488e516716a2bd2211159317eb91bc4a0aa59))
* **Other:** Update Dockerfile ([](https://github.com/omnixys/event-service/commit/378d83edf0ee945e0b22485f6c0c43ecade5189f))
* **Other:** update graphQl schema ([](https://github.com/omnixys/event-service/commit/a16a9a7c04250911d4cb1de4e0eba487823ab4ac))
* **Other:** update seed ([](https://github.com/omnixys/event-service/commit/891ef4d5b95cd12ca94af7160ed3d48b3f96d505))

### Prisma

* **Prisma:** update prisma schema ([](https://github.com/omnixys/event-service/commit/dae6e3546b4e35219445dde8c721903382bdaf76))

### Release

* **Release:** v1.0.0 ([](https://github.com/omnixys/event-service/commit/8a6cd812968ad7b8caf9f788b65bab519c23bddd))
* **Release:** 1.0.0 [skip ci] ([](https://github.com/omnixys/event-service/commit/0b15ec1984814d618e5031c7a92cec5ce545f8ef))
* **Release:** 1.0.1 [skip ci] ([](https://github.com/omnixys/event-service/commit/c11a916c637b490c7eb50265948dac756aa9c27d))
* **Release:** 1.0.2 [skip ci] ([](https://github.com/omnixys/event-service/commit/1f73c96d3c2cf7a8b67c5106282bebf1db6c50ce))
* **Release:** 1.0.3 [skip ci] ([](https://github.com/omnixys/event-service/commit/df2e0942f3d172a54b8b12116b7cd21801b181cf))
* **Release:** 1.0.4 [skip ci] ([](https://github.com/omnixys/event-service/commit/2d7e79717ce490530a16f81e513396f1f225c574))
* **Release:** add SemVer ([](https://github.com/omnixys/event-service/commit/158864b099df3dc385f9f1c7c5c6eda8a79d644a))

### Release-ci

* **Release-ci:** add @semantic-release/npm ([](https://github.com/omnixys/event-service/commit/bfcf0c0946dc91a7bcb74fe0a5f411636d896ff3))
* **Release-ci:** fix Release CI Job ([](https://github.com/omnixys/event-service/commit/55b72abcdb61fcbe86aee00552f3b0b6fc337cdf))

### Service

* **Service:** new event Service ([](https://github.com/omnixys/event-service/commit/76fb4cee2eddb6706f3cf266ea39c6b888c69cd8))
* **Service:** Update deps and switch to local omnixys packages ([](https://github.com/omnixys/event-service/commit/82607c234cc1d02e0ae7f8db9646174a4710e339))

### Setup

* **Setup:** initialize NestJS project with modern config and Husky pre-commit hooks ([](https://github.com/omnixys/event-service/commit/9f403b149cc88c932213446b07292a1d5066463e))

## <small>1.0.4 (2026-02-26)</small>

- Merge branch 'main' of https://github.com/omnixys/omnixys-event-service ([d519579c2f6f86a40c0d399460affac6f9b2e921](https://github.com/omnixys/omnixys-event-service/commit/d519579c2f6f86a40c0d399460affac6f9b2e921))
- fix(release-ci): add @semantic-release/npm ([bfcf0c0946dc91a7bcb74fe0a5f411636d896ff3](https://github.com/omnixys/omnixys-event-service/commit/bfcf0c0946dc91a7bcb74fe0a5f411636d896ff3))

## <small>1.0.3 (2026-02-26)</small>

- fix(release-ci): fix Release CI Job ([55b72abcdb61fcbe86aee00552f3b0b6fc337cdf](https://github.com/omnixys/omnixys-event-service/commit/55b72abcdb61fcbe86aee00552f3b0b6fc337cdf))

## <small>1.0.2 (2026-02-25)</small>

- fix(ci): change serets.SERVICE to vars.SERVICE ([c57204b47d1a629517534ea6097d61d04b5219c2](https://github.com/omnixys/omnixys-event-service/commit/c57204b47d1a629517534ea6097d61d04b5219c2))
- Merge branch 'main' of https://github.com/omnixys/omnixys-event-service ([1f6f0fc9d9db31be1ed6887d0dd331494beb56a2](https://github.com/omnixys/omnixys-event-service/commit/1f6f0fc9d9db31be1ed6887d0dd331494beb56a2))

## <small>1.0.1 (2026-02-25)</small>

- fix(ci): update CI ([5c091f54ce01038fea424923b71cf82af2ee8942](https://github.com/omnixys/omnixys-event-service/commit/5c091f54ce01038fea424923b71cf82af2ee8942))

## 1.0.0 (2026-02-25)

- feat(event-service): implement EventService logic and GraphQL resolvers ([a53ef7b42c3ccab619897fc57441642b6a644007](https://github.com/omnixys/omnixys-event-service/commit/a53ef7b42c3ccab619897fc57441642b6a644007))
- feat(event-service): implement EventService logic and GraphQL resolvers ([aa8c0c00e13d212f5f72071b2495f3ed89bf01fd](https://github.com/omnixys/omnixys-event-service/commit/aa8c0c00e13d212f5f72071b2495f3ed89bf01fd))
- feat(event-service): implement GraphQL schema, DTOs, inputs and payloads ([4d4873981a4e1a152721a7a2775642f89e7e5171](https://github.com/omnixys/omnixys-event-service/commit/4d4873981a4e1a152721a7a2775642f89e7e5171))
- feat(event-service): initialize project structure and base configuration ([8afe9f7020709b1b8150727fcd9d08332c47e2af](https://github.com/omnixys/omnixys-event-service/commit/8afe9f7020709b1b8150727fcd9d08332c47e2af))
- feat(event-service): set up PostgreSQL database, schema and Prisma models ([3d0c8f52360a74bdf812dc1f1fa8831e1f1b789d](https://github.com/omnixys/omnixys-event-service/commit/3d0c8f52360a74bdf812dc1f1fa8831e1f1b789d))
- feat(): workflow completed ([cc8adcc9571b6265844920b618092a3646b760af](https://github.com/omnixys/omnixys-event-service/commit/cc8adcc9571b6265844920b618092a3646b760af))
- add CI ([3a794464df1bf69c8f1fd84f2bfd4cd39aa62446](https://github.com/omnixys/omnixys-event-service/commit/3a794464df1bf69c8f1fd84f2bfd4cd39aa62446))
- add Database ([4bde3cf3d1fd0ac92bf06cf314a38de3013a64fc](https://github.com/omnixys/omnixys-event-service/commit/4bde3cf3d1fd0ac92bf06cf314a38de3013a64fc))
- add tests ([f01efab45c726c69eb96174922fb10678ec94588](https://github.com/omnixys/omnixys-event-service/commit/f01efab45c726c69eb96174922fb10678ec94588))
- Create deploy.yml ([44b30e470fe79e772eb6758e0d04d9388a4397cf](https://github.com/omnixys/omnixys-event-service/commit/44b30e470fe79e772eb6758e0d04d9388a4397cf))
- Merge branch '4-event-task-implement-eventservice-logic-and-graphql-resolvers' ([3a97f3d6a88a2c2e979cb6d48381c14188d5f8b9](https://github.com/omnixys/omnixys-event-service/commit/3a97f3d6a88a2c2e979cb6d48381c14188d5f8b9))
- Merge pull request #5 from omnixys/1-event-task-initialize-event-service-project-structure-and-configuration ([a44bd0669b4f26734fe141bb21ba1bda338d1e9e](https://github.com/omnixys/omnixys-event-service/commit/a44bd0669b4f26734fe141bb21ba1bda338d1e9e)), closes [#5](https://github.com/omnixys/omnixys-event-service/issues/5)
- Merge pull request #6 from omnixys/2-event-task-create-postgresql-user-database-and-initial-schema-for-the-event-service ([0b8f2756e01154cb35c6f5e8ef29c3ace8d8c0d0](https://github.com/omnixys/omnixys-event-service/commit/0b8f2756e01154cb35c6f5e8ef29c3ace8d8c0d0)), closes [#6](https://github.com/omnixys/omnixys-event-service/issues/6)
- Merge pull request #7 from omnixys/3-event-task-implement-graphql-schema-entities-inputs-dtos-and-payloads-for-event-service ([a7347a5c675408306b83f298b84ff56b6ae04bcd](https://github.com/omnixys/omnixys-event-service/commit/a7347a5c675408306b83f298b84ff56b6ae04bcd)), closes [#7](https://github.com/omnixys/omnixys-event-service/issues/7)
- Merge pull request #8 from omnixys/4-event-task-implement-eventservice-logic-and-graphql-resolvers ([738842b3817bb09d366fc299f77a88ec4df8ac9d](https://github.com/omnixys/omnixys-event-service/commit/738842b3817bb09d366fc299f77a88ec4df8ac9d)), closes [#8](https://github.com/omnixys/omnixys-event-service/issues/8)
- Update docker-build.yaml ([124b0b3623fcd11707c5ad38039c4db8f317efd1](https://github.com/omnixys/omnixys-event-service/commit/124b0b3623fcd11707c5ad38039c4db8f317efd1))
- Update docker-build.yaml ([8ae481dec25508c009a49278ec80bf0f3d239988](https://github.com/omnixys/omnixys-event-service/commit/8ae481dec25508c009a49278ec80bf0f3d239988))
- Update docker-build.yaml ([ab10892be66012b1d34001453c8c8eb25f167240](https://github.com/omnixys/omnixys-event-service/commit/ab10892be66012b1d34001453c8c8eb25f167240))
- Update docker-build.yaml ([ab269a12d9518cc00d0ea9bdeb558dc9f9074859](https://github.com/omnixys/omnixys-event-service/commit/ab269a12d9518cc00d0ea9bdeb558dc9f9074859))
- Update docker-build.yaml ([ddd5be905917a0b0ad09a768a4fb7295089548b4](https://github.com/omnixys/omnixys-event-service/commit/ddd5be905917a0b0ad09a768a4fb7295089548b4))
- Update docker-build.yaml ([60f12f29177d1117c3b710b4ac12645de8c96ecc](https://github.com/omnixys/omnixys-event-service/commit/60f12f29177d1117c3b710b4ac12645de8c96ecc))
- update DockerFile ([b0dd5aa1f05134f1198548912c2034d373f2b765](https://github.com/omnixys/omnixys-event-service/commit/b0dd5aa1f05134f1198548912c2034d373f2b765))
- Update Dockerfile ([2b6488e516716a2bd2211159317eb91bc4a0aa59](https://github.com/omnixys/omnixys-event-service/commit/2b6488e516716a2bd2211159317eb91bc4a0aa59))
- Update Dockerfile ([378d83edf0ee945e0b22485f6c0c43ecade5189f](https://github.com/omnixys/omnixys-event-service/commit/378d83edf0ee945e0b22485f6c0c43ecade5189f))
- update graphQl schema ([a16a9a7c04250911d4cb1de4e0eba487823ab4ac](https://github.com/omnixys/omnixys-event-service/commit/a16a9a7c04250911d4cb1de4e0eba487823ab4ac))
- update seed ([891ef4d5b95cd12ca94af7160ed3d48b3f96d505](https://github.com/omnixys/omnixys-event-service/commit/891ef4d5b95cd12ca94af7160ed3d48b3f96d505))
- breaking(prisma): update prisma schema ([dae6e3546b4e35219445dde8c721903382bdaf76](https://github.com/omnixys/omnixys-event-service/commit/dae6e3546b4e35219445dde8c721903382bdaf76))
- chore(setup): initialize NestJS project with modern config and Husky pre-commit hooks ([9f403b149cc88c932213446b07292a1d5066463e](https://github.com/omnixys/omnixys-event-service/commit/9f403b149cc88c932213446b07292a1d5066463e))

## <small>1.0.1 (2025-11-07)</small>

- Initial commit ([135641e](https://github.com/omnixys/omnixys-event-service/commit/135641e))

## <small>1.0.1 (2025-11-06)</small>

- chore(dev): integrate custom Commitlint formatter with Husky hook ([1cc0034](https://github.com/omnixys/omnixys-event-service/commit/1cc0034))

## 1.0.0 (2025-11-06)

- chore(ci): add GPL-3.0-or-later license header to all GitHub workflow files ([4b5488c](https://github.com/omnixys/omnixys-event-service/commit/4b5488c))
- chore(dev): integrate Husky pre-commit and commit-msg hooks for code quality ([261f18f](https://github.com/omnixys/omnixys-event-service/commit/261f18f))
- Initial commit ([7c74f0b](https://github.com/omnixys/omnixys-event-service/commit/7c74f0b))
- Update CHANGELOG.md ([e8b2951](https://github.com/omnixys/omnixys-event-service/commit/e8b2951))
- Update package.json ([f180269](https://github.com/omnixys/omnixys-event-service/commit/f180269))
