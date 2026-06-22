# Event Service

## Overview

The Event Service owns event hierarchies, event settings, memberships, public
RSVP visibility, timelines, and event media metadata. It is a NestJS GraphQL
Federation subgraph backed by PostgreSQL and communicates with other bounded
contexts through typed Kafka events.

## Domain model

- `Event` is the aggregate root. Events can form a parent/child hierarchy.
- `Settings` contains RSVP, capacity, visibility, schedule, and approval rules.
- `Role` is the local event-membership projection.
- `Timeline` stores local lifecycle entries and idempotent cross-service
  milestones.
- `Media` and `MediaVariant` reference objects owned by the configured storage
  provider.
- `Analytics` is the event-level attendance snapshot.

Important invariants include acyclic event trees, owner-controlled destructive
operations, inherited event roles, child capacity not exceeding parent
capacity, and authenticated media access.

## Architecture

```text
src/
├── adapter/       Valkey adapters for framework ports
├── admin/         Administrative HTTP capability
├── config/        Validated environment configuration
├── core/          HTTP and scalar modules
├── event/
│   ├── controller/  Streaming media HTTP endpoints
│   ├── errors/      Structured event-domain errors
│   ├── guards/      Owner, admin, and event-role policies
│   ├── models/      GraphQL inputs, payloads, and mappers
│   ├── resolvers/   Federation queries, mutations, and fields
│   └── services/    Event, media, and geocoding application logic
├── handlers/      Kafka command and event handlers
├── health/        Liveness and dependency readiness
├── prisma/        Database lifecycle and generated Prisma client
└── main.ts        Fastify bootstrap and graceful shutdown
```

Framework ownership is delegated to `@omnixys/context`, `@omnixys/logger`,
`@omnixys/observability`, `@omnixys/security`, `@omnixys/cache`,
`@omnixys/kafka`, `@omnixys/graphql`, `@omnixys/contracts`, and
`@omnixys/media`.

## Request flow

```text
HTTP / GraphQL
  → canonical context middleware
  → verified security guards and rate limits
  → resolver/controller
  → application service
  → Prisma or media storage
  → typed Kafka event
  → correlated logs, traces, and metrics
```

The context scope is the only request-metadata owner. Logger and tracing
automatically use its `requestId`, `correlationId`, `traceId`, `actorId`, and
`tenantId`.

## GraphQL operations

Queries include `event`, `eventRsvp`, `eventChildren`, `eventTree`,
`publicEventTree`, `myEvents`, `eventGuests`, `adminGetEvent`, `adminEvents`,
`geocodeAddress`, `mediaUrl`, and `mediaVariantUrl`.

Mutations include `createEvent`, `updateEvent`, `deleteEvent`, role assignment,
ownership transfer, activation/deactivation, timeline replacement, and media
registration.

Example:

```graphql
mutation CreateEvent($input: CreateEventInput!) {
  createEvent(input: $input) {
    id
    name
    tags
    createdAt
  }
}
```

```json
{
  "input": {
    "name": "Platform Launch",
    "tags": ["🚀 launch", "platform"],
    "settings": {
      "startsAt": "2030-06-01T17:00:00.000Z",
      "endsAt": "2030-06-01T23:00:00.000Z",
      "maxSeats": 200
    }
  }
}
```

Geocoding is authenticated and rate-limited:

```graphql
query Geocode($input: GeocodeAddressInput!) {
  geocodeAddress(input: $input) {
    latitude
    longitude
    displayName
  }
}
```

## Kafka events

Consumed topics:

- `authentication.delete.event`
- `authentication.addRole.event`
- `event.media.uploaded`
- `event.milestone.recorded`

Produced topics include seat creation, address creation/deletion, invitation
cleanup, ticket cleanup, cancellation notification, and asynchronous media
processing. The Kafka package propagates canonical context headers and owns
retry topics, DLQ routing, idempotency, health, drain, and shutdown behavior.

Media uploads stream directly to object storage. Variant generation runs in a
Kafka worker and uses deterministic keys plus database upserts, making retries
safe.

## Custom exceptions

GraphQL errors are mapped by `@omnixys/graphql` and expose stable codes and
diagnostic identifiers. Event-specific codes include:

- `EVENT_NOT_FOUND`
- `EVENT_CLOSED`
- `EVENT_ACCESS_DENIED`
- `EVENT_INVALID_INPUT`
- `EVENT_MEMBER_NOT_FOUND`
- `EVENT_TIMELINE_NOT_FOUND`
- `EVENT_MEDIA_NOT_FOUND`
- `EVENT_MEDIA_VARIANT_NOT_FOUND`
- `GEOCODING_UNAVAILABLE`

Error metadata never contains access tokens, cookies, or storage credentials.

## Logging, metrics, and tracing

HTTP, GraphQL, Kafka, database, external geocoding, and media-processing
lifecycle points use `@omnixys/logger`. Every log contains `requestId`; use it
as the primary Grafana filter to follow one request across services. Trace and
span identifiers come from OpenTelemetry through the canonical context.

Prometheus metrics are enabled through `ObservabilityModule`. The default
metrics port is `9464`.

## Configuration

Required production configuration includes:

- `DATABASE_URL`
- `KAFKA_BROKER`
- `VALKEY_URL`, `VALKEY_PASSWORD`
- `KC_URL`, `KC_REALM`, `KC_CLIENT_SECRET`
- `COOKIE_SECRET`, `ENCRYPTION_KEY`
- `STORAGE_ENDPOINT`, `STORAGE_BUCKET`
- `STORAGE_ACCESS_KEY_ID`, `STORAGE_SECRET_ACCESS_KEY`
- `TEMPO_URI`

Optional geocoding controls are `GEOCODING_URL` and
`GEOCODING_COUNTRY_CODES`. Never commit `.env` files or print their values.

## Health and lifecycle

- `GET /health/liveness` checks the application process.
- `GET /health/readiness` checks Kafka, Valkey, object storage, and configured
  external health endpoints.

Nest shutdown hooks close Prisma, Kafka, logger batches, cache, storage, and
OpenTelemetry resources through package lifecycle hooks.

## Testing

```bash
pnpm build
pnpm test:unit
pnpm test
pnpm exec eslint "src/**/*.ts" --ignore-pattern "src/prisma/generated/**"
```

E2E tests may mutate data. Run them only with local/test PostgreSQL, Kafka,
Valkey, Keycloak, and object-storage endpoints.

## Troubleshooting

- `EVENT_ACCESS_DENIED`: verify the authenticated principal has an inherited
  event role.
- Kafka media retries: inspect `event.media.uploaded.retry` and its DLQ.
- Readiness failure: inspect the dependency-specific entry in the response.
- Missing variants: verify storage access and the media worker consumer group.
- Geocoding unavailable: verify provider reachability and configured country
  restrictions.

## Development and contribution

Use additive GraphQL and Kafka contract evolution. Update
`@omnixys/contracts` before producers and consumers, add migrations for schema
changes, and include focused unit/integration coverage. Do not edit generated
Prisma files manually.

## License

GPL-3.0-or-later.
