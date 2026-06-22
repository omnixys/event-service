import { Readable } from 'node:stream';
import { ContextAccessor } from '@omnixys/context';
import { KafkaTopics } from '@omnixys/kafka';
import assert from 'node:assert/strict';
import test from 'node:test';
import { of, throwError } from 'rxjs';
import { BaseGraphQLError } from '../../dist/event/errors/base-graphql.error.js';
import { GeocodingUnavailableError } from '../../dist/event/errors/geocoding-unavailable.error.js';
import { EventMapper } from '../../dist/event/models/mapper/event.mapper.js';
import { MediaUploadController } from '../../dist/event/controller/media-upload.controller.js';
import { GeocodingService } from '../../dist/event/services/geocoding.service.js';
import { MediaProcessingService } from '../../dist/event/services/media-processing.service.js';
import { MediaHandler } from '../../dist/handlers/media.handler.js';
import { MilestoneHandler } from '../../dist/handlers/milestone.handler.js';

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
