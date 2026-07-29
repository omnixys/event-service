import assert from 'node:assert/strict';
import test from 'node:test';
import 'reflect-metadata';

const { ContextAccessor } = await import('@omnixys/context');
const { AnalyticsOutboxService } = await import(
  '../../dist/analytics/analytics-outbox.service.js'
);

const context = {
  requestId: 'request-event-1',
  correlationId: 'correlation-event-1',
  startedAtEpochMs: Date.now(),
  principal: { subject: 'actor-1', actorId: 'actor-1', roles: [] },
  tenant: {
    tenantId: '11111111-1111-4111-8111-111111111111',
    source: 'verified-principal',
    verified: true,
  },
  client: {},
  transport: { type: 'graphql', operation: 'createEvent' },
  trace: {},
};

test('event facts are persisted with verified context and safe properties', async () => {
  const writes = [];
  const transaction = {
    analyticsOutbox: {
      create: async (input) => {
        writes.push(input);
        return input.data;
      },
    },
  };

  await ContextAccessor.run(context, () =>
    new AnalyticsOutboxService().enqueue(transaction, 'event.created.v1', {
      eventName: 'EventCreated',
      aggregateId: '22222222-2222-4222-8222-222222222222',
      aggregateType: 'event',
      subjectId: 'actor-1',
      properties: { category: 'GENERAL', hasParent: false },
    }),
  );

  assert.equal(writes.length, 1);
  assert.equal(writes[0].data.tenantId, context.tenant.tenantId);
  assert.equal(writes[0].data.payload.producer, 'event');
  assert.equal(writes[0].data.payload.eventName, 'EventCreated');
});

test('event facts reject unverified tenants before an outbox write', () => {
  const transaction = {
    analyticsOutbox: { create: async () => assert.fail('must not persist') },
  };
  assert.throws(
    () =>
      ContextAccessor.run(
        {
          ...context,
          tenant: { ...context.tenant, verified: false },
        },
        () =>
          new AnalyticsOutboxService().enqueue(transaction, 'event.updated.v1', {
            eventName: 'EventUpdated',
            aggregateId: '22222222-2222-4222-8222-222222222222',
            aggregateType: 'event',
            properties: {},
          }),
      ),
    /Verified UUID tenant context/,
  );
});
