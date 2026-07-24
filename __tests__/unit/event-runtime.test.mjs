import { Readable } from 'node:stream';
import { readFile } from 'node:fs/promises';
import { ContextAccessor } from '@omnixys/context';
import { KafkaTopics } from '@omnixys/kafka';
import assert from 'node:assert/strict';
import test from 'node:test';
import { of, throwError } from 'rxjs';
import { BaseGraphQLError } from '../../dist/event/errors/base-graphql.error.js';
import { GeocodingUnavailableError } from '../../dist/event/errors/geocoding-unavailable.error.js';
import { EventMutationResolver } from '../../dist/event/resolvers/event-mutation.resolver.js';
import { EventMapper } from '../../dist/event/models/mapper/event.mapper.js';
import { MediaUploadController } from '../../dist/event/controller/media-upload.controller.js';
import { GeocodingService } from '../../dist/event/services/geocoding.service.js';
import { EventRbacService } from '../../dist/event/services/event-rbac.service.js';
import { EventWriteService } from '../../dist/event/services/event-write.service.js';
import { UserProjectionService } from '../../dist/event/services/user-projection.service.js';
import { MediaProcessingService } from '../../dist/event/services/media-processing.service.js';
import { MediaHandler } from '../../dist/handlers/media.handler.js';
import { MilestoneHandler } from '../../dist/handlers/milestone.handler.js';
import {
  EVENT_PERMISSION_KEYS,
  EventPermissionKey,
  EventRoleType,
  getDefaultPermissionsForEventRole,
} from '@omnixys/contracts';

const logger = {
  log() {
    return {
      info() {},
      debug() {},
      warn() {},
      error() {},
    };
  },
};

test('event domain errors capture canonical diagnostic identifiers', () => {
  ContextAccessor.run(
    {
      requestId: 'request-event',
      correlationId: 'correlation-event',
      actorId: 'actor-event',
      tenantId: 'tenant-event',
      traceId: 'trace-event',
    },
    () => {
      const error = new BaseGraphQLError('Failure', 'EVENT_FAILURE', {
        eventId: 'event-1',
      });
      assert.equal(error.requestId, 'request-event');
      assert.equal(error.correlationId, 'correlation-event');
      assert.equal(error.traceId, 'trace-event');
      assert.equal(error.actorId, 'actor-event');
      assert.equal(error.tenantId, 'tenant-event');
      assert.deepEqual(error.metadata, { eventId: 'event-1' });
    },
  );
});

test('createEvent forwards only sanitized actor claims to the write service', async () => {
  const calls = [];
  const resolver = new EventMutationResolver({
    async createEvent(input, actor) {
      calls.push({ input, actor });
      return { id: 'event-1' };
    },
  });

  await resolver.createEvent(
    { name: 'Sanitized actor' },
    {
      id: 'actor-1',
      username: 'caleb',
      firstName: 'Caleb',
      lastName: 'Omnixys',
      email: 'caleb@omnixys.com',
      access_token: 'must-not-leak',
      refresh_token: 'must-not-leak',
      raw: { sub: 'actor-1', token: 'must-not-leak' },
    },
  );

  assert.deepEqual(calls, [
    {
      input: { name: 'Sanitized actor' },
      actor: {
        id: 'actor-1',
        username: 'caleb',
        firstName: 'Caleb',
        lastName: 'Omnixys',
        email: 'caleb@omnixys.com',
      },
    },
  ]);
});

test('default event RBAC permissions preserve legacy equivalence and guest self-service split', () => {
  const admin = getDefaultPermissionsForEventRole(EventRoleType.ADMIN);
  assert.deepEqual(new Set(admin), new Set(EVENT_PERMISSION_KEYS));

  const security = getDefaultPermissionsForEventRole(EventRoleType.SECURITY);
  assert.ok(security.includes(EventPermissionKey.ViewGuests));
  assert.ok(security.includes(EventPermissionKey.ViewTickets));
  assert.ok(security.includes(EventPermissionKey.ViewSeats));
  assert.ok(security.includes(EventPermissionKey.ScanTickets));

  const guest = getDefaultPermissionsForEventRole(EventRoleType.GUEST);
  assert.ok(guest.includes(EventPermissionKey.ViewSelfTicket));
  assert.ok(guest.includes(EventPermissionKey.ViewSelfSeat));
  assert.ok(guest.includes(EventPermissionKey.ManageSelfPlusOnes));
  assert.equal(guest.includes(EventPermissionKey.ViewGuests), false);
  assert.equal(guest.includes(EventPermissionKey.ViewTickets), false);
  assert.equal(guest.includes(EventPermissionKey.ViewSeats), false);

  const support = getDefaultPermissionsForEventRole(EventRoleType.SUPPORT);
  assert.ok(support.includes(EventPermissionKey.ViewSupport));
  assert.ok(support.includes(EventPermissionKey.RespondSupport));
  assert.ok(support.includes(EventPermissionKey.ViewNotifications));
  assert.equal(support.includes(EventPermissionKey.ViewTickets), false);
});

test('current owner access is published for root and child events', async () => {
  const published = [];
  const service = new EventRbacService(
    {},
    logger,
    {
      async send(event) {
        published.push(event);
      },
    },
  );

  service.getAccessForUser = async (userId, eventId) => ({
    eventId,
    userId,
    roles: [],
    permissions: [...EVENT_PERMISSION_KEYS],
  });

  await Promise.all([
    service.publishCurrentAccess('event-root', 'owner-1', 'owner-1'),
    service.publishCurrentAccess('event-child', 'owner-1', 'owner-1'),
  ]);

  assert.deepEqual(
    published.map(({ topic, payload }) => ({
      topic,
      eventId: payload.eventId,
      userId: payload.userId,
      canSendNotifications: payload.permissions.includes(EventPermissionKey.SendNotifications),
    })),
    [
      {
        topic: KafkaTopics.event.userAccessChanged,
        eventId: 'event-root',
        userId: 'owner-1',
        canSendNotifications: true,
      },
      {
        topic: KafkaTopics.event.userAccessChanged,
        eventId: 'event-child',
        userId: 'owner-1',
        canSendNotifications: true,
      },
    ],
  );
});

test('authenticated actor projection is written before the event transaction creates a role', async () => {
  const operations = [];
  const transactionClient = {
    event: {
      async create() {
        operations.push('event');
        throw new Error('stop after ordering assertion');
      },
    },
  };
  const prisma = {
    async $transaction(callback) {
      return callback(transactionClient);
    },
  };
  const projection = {
    async upsertAuthenticatedUser(actor, client) {
      assert.equal(client, transactionClient);
      assert.deepEqual(actor, {
        id: 'actor-1',
        username: 'caleb',
        firstName: 'Caleb',
        lastName: 'Omnixys',
        email: 'caleb@omnixys.com',
      });
      operations.push('projection');
    },
  };
  const service = new EventWriteService(
    prisma,
    logger,
    { send: async () => {} },
    {},
    projection,
  );

  await assert.rejects(
    service.createEvent(
      { name: 'Projection ordering' },
      {
        id: 'actor-1',
        username: 'caleb',
        firstName: 'Caleb',
        lastName: 'Omnixys',
        email: 'caleb@omnixys.com',
      },
    ),
    /stop after ordering assertion/,
  );
  assert.deepEqual(operations, ['projection', 'event']);
});

test('authenticated user projection falls back to the user id and remains an upsert', async () => {
  const calls = [];
  const service = new UserProjectionService(
    {},
    logger,
  );
  const client = {
    userProjection: {
      async upsert(args) {
        calls.push(args);
        return { id: args.where.id, ...args.create };
      },
    },
  };

  await service.upsertAuthenticatedUser(
    { id: 'actor-1', username: '', firstName: 'Caleb', lastName: 'Omnixys' },
    client,
  );
  await service.upsertAuthenticatedUser(
    { id: 'actor-1', username: 'caleb', firstName: 'Caleb', lastName: 'Updated' },
    client,
  );

  assert.equal(calls[0].create.username, 'actor-1');
  assert.equal(calls[0].create.displayName, 'Caleb Omnixys');
  assert.equal(calls[1].where.id, 'actor-1');
  assert.equal(calls[1].update.username, 'caleb');
  assert.equal(calls[1].update.displayName, 'Caleb Updated');
});

test('strict user projection lookup maps an unknown target to USER_NOT_FOUND', async () => {
  const service = new UserProjectionService(
    {
      userProjection: {
        async findMany() {
          return [];
        },
        async upsert() {
          throw new Error('upsert must not run without a returned user');
        },
      },
    },
    logger,
  );
  service.getUsersByIds = async () => ({ users: [] });

  await assert.rejects(service.requireUsers(['missing-user']), (error) => {
    assert.equal(error.code, 'USER_NOT_FOUND');
    assert.equal(error.metadata.userId, 'missing-user');
    return true;
  });
});

test('legacy role assignment requires the target projection before writing the role', async () => {
  const operations = [];
  const service = new EventWriteService(
    {
      event: {
        async findUnique() {
          return { id: 'event-1' };
        },
      },
      role: {
        async upsert() {
          operations.push('role');
        },
      },
      async $transaction(promises) {
        await Promise.all(promises);
      },
    },
    logger,
    { send: async () => {} },
    {
      async syncLegacyRoleAssignment() {},
    },
    {
      async requireUsers(userIds) {
        assert.deepEqual(userIds, ['target-1']);
        operations.push('projection');
      },
    },
  );
  service.loadEventPayload = async () => ({ id: 'event-1' });

  await service.assignUserToEvent({
    eventId: 'event-1',
    userId: 'target-1',
    eventRole: 'GUEST',
    actorId: 'admin-1',
  });

  assert.deepEqual(operations, ['projection', 'role']);
});

test('modern RBAC assignment requires the target projection before writing the assignment', async () => {
  const operations = [];
  const service = new EventRbacService(
    {
      eventUserRoleAssignment: {
        async upsert() {
          operations.push('assignment');
        },
      },
    },
    logger,
    { send: async () => {} },
    {
      async requireUsers(userIds) {
        assert.deepEqual(userIds, ['target-1']);
        operations.push('projection');
      },
    },
  );
  service.getRoleOrThrow = async () => ({
    id: 'role-1',
    eventId: 'event-1',
    archivedAt: null,
  });
  service.getAccessForUser = async () => ({
    eventId: 'event-1',
    userId: 'target-1',
    roles: [],
    permissions: [],
  });
  service.publishAccessChanged = async () => {};

  await service.assignRole(
    { eventId: 'event-1', roleId: 'role-1', userId: 'target-1' },
    'admin-1',
  );

  assert.deepEqual(operations, ['projection', 'assignment']);
});

test('ownership transfer requires both owner projections before writing roles', async () => {
  const operations = [];
  const service = new EventWriteService(
    {
      event: {
        async findUnique() {
          return { owner: 'owner-1' };
        },
        async update() {
          operations.push('owner-update');
        },
      },
      role: {
        async upsert() {
          operations.push('role');
        },
      },
      async $transaction(promises) {
        await Promise.all(promises);
      },
    },
    logger,
    { send: async () => {} },
    {
      async syncLegacyRoleAssignment() {},
    },
    {
      async requireUsers(userIds) {
        assert.deepEqual(userIds, ['new-owner-1', 'owner-1']);
        operations.push('projection');
      },
    },
  );

  await service.transferEventOwnership('event-1', 'new-owner-1', 'owner-1');

  assert.equal(operations[0], 'projection');
  assert.equal(operations.filter((operation) => operation === 'role').length, 2);
  assert.ok(operations.includes('owner-update'));
});

test('user projection migration is repeatable and backfills legacy role users before the FK', async () => {
  const sql = await readFile(
    new URL('../../prisma/migrations/20260723003000_add_user_projection_fk/migration.sql', import.meta.url),
    'utf8',
  );

  assert.match(sql, /CREATE TABLE IF NOT EXISTS "user_projection"/);
  assert.match(sql, /SELECT DISTINCT "user_id", "user_id"::text/);
  assert.match(sql, /ON CONFLICT \("id"\) DO NOTHING/);
  assert.match(sql, /IF NOT EXISTS/);
  assert.ok(sql.indexOf('INSERT INTO "user_projection"') < sql.indexOf('ADD CONSTRAINT'));
});

test('role mutations authorize against the resolved role event', async () => {
  const checkedEventIds = [];
  const service = new EventRbacService(
    {
      eventRoleDefinition: {
        async findUnique() {
          return {
            id: 'role-b',
            eventId: 'event-b',
            key: 'worker',
            name: 'Worker',
            description: null,
            color: null,
            icon: null,
            systemKey: null,
            archivedAt: null,
            permissions: [],
            _count: { assignments: 0 },
          };
        },
        async update() {
          throw new Error('update must not run without event-b permission');
        },
      },
    },
    logger,
    { send: async () => {} },
  );
  service.getPermissionKeysForUser = async (_userId, eventId) => {
    checkedEventIds.push(eventId);
    return eventId === 'event-a' ? [EventPermissionKey.ManageRoles] : [];
  };

  await assert.rejects(
    service.updateRole({ eventId: 'event-b', roleId: 'role-b', name: 'Worker 2' }, 'actor-1'),
    (error) => {
      assert.equal(error.code, 'EVENT_ACCESS_DENIED');
      return true;
    },
  );
  assert.deepEqual(checkedEventIds, ['event-b']);
});

test('role mutations reject mismatched requested event before permission checks', async () => {
  let permissionChecks = 0;
  const service = new EventRbacService(
    {
      eventRoleDefinition: {
        async findUnique() {
          return {
            id: 'role-b',
            eventId: 'event-b',
            key: 'worker',
            name: 'Worker',
            description: null,
            color: null,
            icon: null,
            systemKey: null,
            archivedAt: null,
            permissions: [],
            _count: { assignments: 0 },
          };
        },
      },
    },
    logger,
    { send: async () => {} },
  );
  service.getPermissionKeysForUser = async () => {
    permissionChecks += 1;
    return [EventPermissionKey.ManageRoles];
  };

  await assert.rejects(
    service.archiveRole({ eventId: 'event-a', roleId: 'role-b' }, 'actor-1'),
    (error) => {
      assert.equal(error.code, 'EVENT_INVALID_INPUT');
      return true;
    },
  );
  assert.equal(permissionChecks, 0);
});

test('geocoding validates upstream results and maps failures', async () => {
  const service = new GeocodingService(
    {
      get() {
        return of({
          data: [
            {
              lat: '48.8153',
              lon: '9.2088',
              display_name: 'Stuttgart, Germany',
            },
          ],
        });
      },
    },
    logger,
  );
  assert.deepEqual(await service.geocode('Stuttgart'), {
    latitude: 48.8153,
    longitude: 9.2088,
    displayName: 'Stuttgart, Germany',
  });

  const unavailable = new GeocodingService(
    { get: () => throwError(() => new Error('offline')) },
    logger,
  );
  await assert.rejects(
    unavailable.geocode('Stuttgart'),
    GeocodingUnavailableError,
  );
});

test('media uploads stream to storage and publish async processing', async () => {
  let uploaded = Buffer.alloc(0);
  let published;
  const storage = {
    async uploadStream({ body }) {
      const chunks = [];
      for await (const chunk of body) chunks.push(Buffer.from(chunk));
      uploaded = Buffer.concat(chunks);
      return 'https://media.test/event/media.webp';
    },
    async delete() {},
  };
  const controller = new MediaUploadController(
    storage,
    {
      async create(value) {
        return { ...value, id: 'media-1' };
      },
      async delete() {
        return { success: true };
      },
    },
    { resolveRole: async () => 'ADMIN' },
    { send: async (event) => (published = event) },
    logger,
  );
  const response = await controller.upload(
    {
      isMultipart: () => true,
      file: async () => ({
        filename: 'image.webp',
        mimetype: 'image/webp',
        file: Object.assign(Readable.from([Buffer.from('image')]), {
          truncated: false,
        }),
      }),
    },
    'event-1',
    'GALLERY',
    { id: 'actor-1' },
  );

  assert.equal(uploaded.toString(), 'image');
  assert.equal(response.size, 5);
  assert.equal(published.topic, KafkaTopics.event.mediaUploaded);
  assert.equal(published.payload.mediaId, 'media-1');
});

test('media processing is retry-safe and persists actual dimensions', async () => {
  const upserts = [];
  const prisma = {
    media: {
      findUnique: async () => ({ id: 'media-1', key: 'source.webp' }),
    },
    mediaVariant: {
      upsert: (operation) => {
        upserts.push(operation);
        return Promise.resolve(operation.create);
      },
    },
    $transaction: async (operations) => Promise.all(operations),
  };
  const processing = new MediaProcessingService(
    prisma,
    {
      generateVariants: async () => [
        {
          buffer: Buffer.from('variant'),
          width: 320,
          height: 180,
          format: 'webp',
        },
      ],
    },
    logger,
    {
      get: async () => Buffer.from('source'),
      upload: async ({ key }) => `https://media.test/${key}`,
    },
  );

  await processing.processFromStorage('media-1', 'source.webp');
  await processing.processFromStorage('media-1', 'source.webp');
  assert.equal(upserts.length, 2);
  assert.equal(upserts[0].create.height, 180);
  assert.deepEqual(upserts[0].where.mediaId_width_format, {
    mediaId: 'media-1',
    width: 320,
    format: 'webp',
  });
});

test('Kafka media handler delegates failures for package retry and DLQ policy', async () => {
  const handler = new MediaHandler(
    {
      async processFromStorage() {
        throw new Error('processing failed');
      },
    },
    logger,
  );

  await assert.rejects(
    handler.handleMediaUploaded({
      eventId: 'event-1',
      mediaId: 'media-1',
      key: 'source.webp',
      filename: 'source.webp',
      mimetype: 'image/webp',
      type: 'GALLERY',
    }),
    /processing failed/,
  );
});

test('Kafka milestones are delegated to the idempotent event timeline writer', async () => {
  const received = [];
  const handler = new MilestoneHandler(
    { recordMilestone: async (value) => received.push(value) },
    logger,
  );
  const milestone = {
    eventId: 'event-1',
    milestoneId: 'invitation-1:created',
    type: 'INVITATION_CREATED',
    label: 'Invitation created',
    occurredAt: new Date(0).toISOString(),
    referenceId: 'invitation-1',
  };

  await handler.handleMilestone(milestone);
  assert.deepEqual(received, [milestone]);
});

test('event mapping preserves normalized categorization tags', () => {
  const payload = EventMapper.toPayload({
    id: 'event-1',
    name: 'Launch',
    owner: 'actor-1',
    tags: ['🚀 launch'],
    parentId: null,
    path: 'event-1',
    depth: 0,
    coverMediaId: null,
    logoMediaId: null,
    createdAt: new Date(0),
    updatedAt: null,
    settings: null,
  });
  assert.deepEqual(payload.tags, ['🚀 launch']);
});

test('role removal publishes empty permissions when no modern role remains (no legacy fallback re-grant)', async () => {
  const published = [];
  const service = new EventRbacService(
    {
      eventRoleDefinition: {
        async findUnique() {
          return {
            id: 'role-to-remove',
            eventId: 'event-1',
            key: 'custom',
            name: 'Custom',
            description: null,
            color: null,
            icon: null,
            systemKey: null,
            archivedAt: null,
            permissions: [],
            _count: { assignments: 1 },
          };
        },
        async update() {
          return {};
        },
      },
      eventUserRoleAssignment: {
        async deleteMany() {
          return { count: 1 };
        },
        async findMany() {
          return [];
        },
      },
      eventRolePermission: { async deleteMany() {} },
      eventPermissionDefinition: { async findMany() { return []; } },
    },
    logger,
    { send: async (event) => published.push(event) },
  );

  const access = await service.removeRole(
    { eventId: 'event-1', userId: 'user-1', roleId: 'role-to-remove' },
    'actor-1',
  );

  assert.deepEqual(access.permissions, []);
  assert.deepEqual(access.roles, []);
  assert.equal(published.length, 1);
  assert.deepEqual(published[0].payload.permissions, []);
});

test('role removal propagates Kafka publish failure', async () => {
  const kafkaError = new Error('Kafka broker unreachable');
  const service = new EventRbacService(
    {
      eventRoleDefinition: {
        async findUnique() {
          return {
            id: 'role-to-remove',
            eventId: 'event-1',
            key: 'custom',
            name: 'Custom',
            description: null,
            color: null,
            icon: null,
            systemKey: null,
            archivedAt: null,
            permissions: [],
            _count: { assignments: 1 },
          };
        },
      },
      eventUserRoleAssignment: {
        async deleteMany() {
          return { count: 1 };
        },
        async findMany() {
          return [];
        },
      },
      eventRolePermission: { async deleteMany() {} },
    },
    logger,
    {
      send: async () => {
        throw kafkaError;
      },
    },
  );

  await assert.rejects(
    service.removeRole(
      { eventId: 'event-1', userId: 'user-1', roleId: 'role-to-remove' },
      'actor-1',
    ),
    (error) => {
      assert.equal(error, kafkaError);
      return true;
    },
  );
});

test('event mapping preserves invited-by options from settings', () => {
  const now = new Date(0);
  const payload = EventMapper.toPayload({
    id: 'event-1',
    name: 'Launch',
    owner: 'actor-1',
    tags: [],
    parentId: null,
    path: 'event-1',
    depth: 0,
    coverMediaId: null,
    logoMediaId: null,
    createdAt: now,
    updatedAt: null,
    settings: {
      id: 'settings-1',
      eventId: 'event-1',
      allowReEntry: true,
      rotateSeconds: 300,
      maxSeats: 50,
      allowPublicRsvp: true,
      allowPublicPlusOne: true,
      allowPublicRsvpWebsite: false,
      allowPlusOneUpdate: false,
      approvalMode: 'MANUAL',
      allowGuestSeatSelection: false,
      maxPlusOnes: 0,
      requireApprovalForPlusOnes: true,
      rsvpDeadline: null,
      allowSeatOverbooking: false,
      publicRsvpWebsite: null,
      invitedByOptions: ['Team', 'Host'],
      isActive: true,
      isPublic: false,
      dressCode: null,
      description: null,
      startsAt: now,
      endsAt: now,
      category: 'GENERAL',
      createdAt: now,
      updatedAt: null,
    },
  });

  assert.deepEqual(payload.settings.invitedByOptions, ['Team', 'Host']);
});
