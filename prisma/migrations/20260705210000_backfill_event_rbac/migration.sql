-- Seed the canonical event RBAC permission catalog.
INSERT INTO "event_permission" ("key", "category", "label", "description")
VALUES
  ('event.view', 'event', 'View event', 'View the event overview and core event details.'),
  ('event.edit', 'event', 'Edit event', 'Update core event details.'),
  ('event.delete', 'event', 'Delete event', 'Delete the event.'),
  ('guests.view', 'guests', 'View guests', 'View guest lists and guest details.'),
  ('guests.manage', 'guests', 'Manage guests', 'Create and update guest records.'),
  ('guests.approve', 'guests', 'Approve guests', 'Approve guest and plus-one requests.'),
  ('guests.export', 'guests', 'Export guests', 'Export guest data.'),
  ('invitations.view', 'invitations', 'View invitations', 'View invitations and RSVP status.'),
  ('invitations.manage', 'invitations', 'Manage invitations', 'Create, update, approve, and delete invitations.'),
  ('seats.view', 'seats', 'View seats', 'View seating plans and seat assignments.'),
  ('seats.self.view', 'seats', 'View own seat', 'View the authenticated guest''s assigned seat.'),
  ('seats.manage', 'seats', 'Manage seats', 'Create and update seating plans.'),
  ('tickets.view', 'tickets', 'View tickets', 'View ticket information.'),
  ('tickets.self.view', 'tickets', 'View own ticket', 'View the authenticated guest''s own ticket.'),
  ('tickets.manage', 'tickets', 'Manage tickets', 'Create, update, revoke, and reissue tickets.'),
  ('tickets.scan', 'tickets', 'Scan tickets', 'Scan QR codes and check tickets in or out.'),
  ('plus_ones.manage', 'plus_ones', 'Manage plus-ones', 'Manage plus-one records and approvals.'),
  ('plus_ones.self.manage', 'plus_ones', 'Manage own plus-ones', 'Manage plus-one records owned by the authenticated guest.'),
  ('analytics.view', 'analytics', 'View analytics', 'View event analytics and dashboards.'),
  ('support.view', 'support', 'View support', 'View support conversations.'),
  ('support.manage', 'support', 'Manage support', 'Assign, close, and administer support conversations.'),
  ('support.respond', 'support', 'Respond support', 'Reply to support conversations.'),
  ('notifications.view', 'notifications', 'View notifications', 'View notification history and status.'),
  ('notifications.send', 'notifications', 'Send notifications', 'Send event notifications.'),
  ('timeline.view', 'timeline', 'View timeline', 'View event timeline entries.'),
  ('timeline.manage', 'timeline', 'Manage timeline', 'Create, update, and remove event timeline entries.'),
  ('settings.view', 'settings', 'View event settings', 'View event settings.'),
  ('settings.manage', 'settings', 'Manage event settings', 'Update event settings.'),
  ('roles.view', 'roles', 'View roles', 'View event roles and permissions.'),
  ('roles.manage', 'roles', 'Manage roles', 'Create, update, assign, archive, and delete event roles.'),
  ('staff.view', 'staff', 'View staff', 'View event staff assignments.'),
  ('staff.manage', 'staff', 'Manage staff', 'Manage event staff assignments.'),
  ('media.view', 'media', 'View media', 'View event media.'),
  ('media.manage', 'media', 'Manage media', 'Upload, update, and remove event media.'),
  ('data.export', 'data', 'Export data', 'Export event data.'),
  ('audit.view', 'audit', 'View audit log', 'View event audit logs.')
ON CONFLICT ("key") DO UPDATE SET
  "category" = EXCLUDED."category",
  "label" = EXCLUDED."label",
  "description" = EXCLUDED."description";

-- Create system roles for every existing event.
INSERT INTO "event_role" ("event_id", "key", "name", "description", "color", "icon", "system_key")
SELECT "id", 'admin', 'Admin', 'Full event administration access.', '#2563eb', 'shield', 'ADMIN'::"event_system_role_key"
FROM "event"
ON CONFLICT ("event_id", "key") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "system_key" = EXCLUDED."system_key";

INSERT INTO "event_role" ("event_id", "key", "name", "description", "color", "icon", "system_key")
SELECT "id", 'security', 'Security', 'Ticket scanning and guest check-in access.', '#059669', 'qr-code', 'SECURITY'::"event_system_role_key"
FROM "event"
ON CONFLICT ("event_id", "key") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "system_key" = EXCLUDED."system_key";

INSERT INTO "event_role" ("event_id", "key", "name", "description", "color", "icon", "system_key")
SELECT "id", 'guest', 'Guest', 'Guest self-service access.', '#7c3aed', 'ticket', 'GUEST'::"event_system_role_key"
FROM "event"
ON CONFLICT ("event_id", "key") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "system_key" = EXCLUDED."system_key";

-- SUPPORT remains a legacy compatibility role and is only created where legacy data uses it.
INSERT INTO "event_role" ("event_id", "key", "name", "description", "color", "icon")
SELECT DISTINCT "event_id", 'support', 'Support', 'Support conversation access.', '#db2777', 'message-circle'
FROM "user_event_role"
WHERE "role"::text = 'SUPPORT'
ON CONFLICT ("event_id", "key") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description";

-- Assign default permissions. Do not delete extra permissions to keep this migration idempotent and non-destructive.
INSERT INTO "event_role_permission" ("role_id", "permission_key")
SELECT role."id", permission."key"
FROM "event_role" role
CROSS JOIN "event_permission" permission
WHERE role."key" = 'admin'
ON CONFLICT ("role_id", "permission_key") DO NOTHING;

WITH role_permissions("role_key", "permission_key") AS (
  VALUES
    ('security', 'event.view'),
    ('security', 'guests.view'),
    ('security', 'tickets.view'),
    ('security', 'seats.view'),
    ('security', 'timeline.view'),
    ('security', 'tickets.scan'),
    ('guest', 'event.view'),
    ('guest', 'tickets.self.view'),
    ('guest', 'seats.self.view'),
    ('guest', 'plus_ones.self.manage'),
    ('guest', 'timeline.view'),
    ('support', 'event.view'),
    ('support', 'support.view'),
    ('support', 'support.respond'),
    ('support', 'notifications.view')
)
INSERT INTO "event_role_permission" ("role_id", "permission_key")
SELECT role."id", role_permissions."permission_key"
FROM "event_role" role
JOIN role_permissions ON role_permissions."role_key" = role."key"
JOIN "event_permission" permission ON permission."key" = role_permissions."permission_key"
ON CONFLICT ("role_id", "permission_key") DO NOTHING;

-- Backfill existing enum-based event assignments into event-scoped RBAC assignments.
INSERT INTO "event_user_role" ("event_id", "user_id", "role_id", "assigned_by")
SELECT legacy."event_id", legacy."user_id", role."id", NULL
FROM "user_event_role" legacy
JOIN "event_role" role
  ON role."event_id" = legacy."event_id"
 AND role."key" = lower(legacy."role"::text)
ON CONFLICT ("event_id", "user_id", "role_id") DO NOTHING;
