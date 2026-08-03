import { currentErrorOptions } from './base-graphql.error.js';
import { BaseGraphQLError } from './base-graphql.error.js';
import {
  EventClosedException,
  EventNotFoundException,
  FrameworkException,
  UserNotFoundException,
} from '@omnixys/contracts-ts';

export class EventNotFoundError extends EventNotFoundException {
  constructor(eventId?: string) {
    super(eventId, currentErrorOptions());
  }
}

export class EventClosedError extends EventClosedException {
  constructor(eventId?: string) {
    super(eventId, currentErrorOptions());
  }
}

export class EventAccessDeniedError extends FrameworkException {
  constructor(eventId: string, reason: string) {
    super(
      'EVENT_ACCESS_DENIED',
      'Access to the event is not authorized',
      currentErrorOptions({ eventId, reason }),
    );
  }
}

export class EventValidationError extends BaseGraphQLError {
  constructor(
    message: string,
    metadata: Readonly<Record<string, unknown>> = {},
  ) {
    super(message, 'EVENT_INVALID_INPUT', metadata);
  }
}

export class EventAuthenticationRequiredError extends BaseGraphQLError {
  constructor() {
    super('Authentication is required', 'UNAUTHENTICATED');
  }
}

export class EventMemberNotFoundError extends BaseGraphQLError {
  constructor(eventId: string, userId: string) {
    super('User is not assigned to the event', 'EVENT_MEMBER_NOT_FOUND', {
      eventId,
      userId,
    });
  }
}

export class EventUserNotFoundError extends UserNotFoundException {
  constructor(userId: string) {
    super(userId, currentErrorOptions());
  }
}

export class EventTimelineNotFoundError extends BaseGraphQLError {
  constructor(eventId: string, timelineIds: readonly string[] = []) {
    super('Event timeline entry was not found', 'EVENT_TIMELINE_NOT_FOUND', {
      eventId,
      timelineIds,
    });
  }
}

export class EventMediaNotFoundError extends BaseGraphQLError {
  constructor(mediaId: string, variant = false) {
    super(
      variant ? 'Media variant was not found' : 'Media was not found',
      variant ? 'EVENT_MEDIA_VARIANT_NOT_FOUND' : 'EVENT_MEDIA_NOT_FOUND',
      { mediaId },
    );
  }
}

export class InvalidEventTokenError extends BaseGraphQLError {
  constructor(reason: string) {
    super('Event verification token is invalid', 'EVENT_TOKEN_INVALID', {
      reason,
    });
  }
}
