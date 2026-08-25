import assert from 'node:assert/strict';
import test from 'node:test';
import 'reflect-metadata';

const { RoleGuard } = await import('@omnixys/security-ts');
const { RealmRoleType } = await import('@omnixys/contracts-ts');
const { EventRbacResolver } = await import(
  '../../dist/event/resolvers/event-rbac.resolver.js'
);
const { EventMutationResolver } = await import(
  '../../dist/event/resolvers/event-mutation.resolver.js'
);

const guard = new RoleGuard();

function contextFor(handler, realmRoles) {
  return {
    getClass: () => EventRbacResolver,
    getHandler: () => handler,
    getType: () => 'http',
    switchToHttp: () => ({
      getRequest: () => ({
        user: { id: '11111111-1111-4111-8111-111111111111', roles: realmRoles },
      }),
    }),
  };
}

function assertAllowed(handler, realmRoles) {
  assert.equal(
    guard.canActivate(contextFor(handler, realmRoles)),
    true,
    `expected roles [${realmRoles.join(', ')}] to be accepted`,
  );
}

function assertDenied(handler, realmRoles) {
  assert.throws(
    () => guard.canActivate(contextFor(handler, realmRoles)),
    (error) => error instanceof Error && /Insufficient permissions/.test(error.message),
    `expected roles [${realmRoles.join(', ')}] to be rejected`,
  );
}

test('EventRbacResolver accepts ADMIN-only realm users (admin has no USER role)', () => {
  assertAllowed(EventRbacResolver.prototype.myEventAccess, [RealmRoleType.ADMIN]);
});

test('EventRbacResolver accepts USER realm users', () => {
  assertAllowed(EventRbacResolver.prototype.myEventAccess, [RealmRoleType.USER]);
});

test('EventRbacResolver rejects unrelated realm users', () => {
  assertDenied(EventRbacResolver.prototype.myEventAccess, [RealmRoleType.GUEST]);
});

test('every decorated EventMutationResolver operation accepts ADMIN-only realm users', () => {
  const operations = [
    'createEvent',
    'updateEvent',
    'deleteEvent',
    'assignUserToEvent',
    'removeUserFromEvent',
    'transferEventOwnership',
    'activateEvent',
    'deactivateEvent',
    'addTimeLines',
    'updateTimeLines',
    'removeTimeLines',
    'setTimelines',
  ];

  for (const operation of operations) {
    const handler = EventMutationResolver.prototype[operation];
    assert.equal(typeof handler, 'function', `unknown resolver operation: ${operation}`);
    assertAllowed(handler, [RealmRoleType.ADMIN]);
    assertAllowed(handler, [RealmRoleType.USER]);
  }
});
