/**
 * @license GPL-3.0-or-later
 * Copyright (C) 2025 Caleb Gyamfi - Omnixys Technologies
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * For more information, visit <https://www.gnu.org/licenses/>.
 */

import { Injectable } from '@nestjs/common';

import { EventWriteService } from '../event/services/event-write.service.js';
import { UserRoleType } from '../prisma/generated/client.js';
import { ValkeyKey, ValkeyService } from '@omnixys/cache';
import {
  IKafkaEventContext,
  KAFKA_HEADERS,
  KafkaEvent,
  KafkaEventHandler,
  KafkaTopics,
} from '@omnixys/kafka';
import { OmnixysLogger } from '@omnixys/logger';
import { TraceRunner } from '@omnixys/observability';
import { EncryptionService } from '@omnixys/security';
import {
  CreateUserWithInvitationIdDTO,
  GuestEventKey,
  GuestSignUpTokenPayload,
  UserIdDTO,
} from '@omnixys/shared';

/**
 * Kafka event handler responsible for useristrative commands such as
 * shutdown and restart. It listens for specific user-related topics
 * and delegates the actual process control logic to the {@link UserService}.
 *
 * @category Messaging
 * @since 1.0.0
 */
@KafkaEventHandler('authentication')
@Injectable()
export class AuthenticationHandler {
  private readonly logger;

  /**
   * Creates a new instance of {@link UserHandler}.
   *
   * @param loggerService - The central logger service used for structured logging.
   * @param userService - The service responsible for handling system-level user operations.
   */
  constructor(
    loggerService: OmnixysLogger,
    private readonly eventWriteService: EventWriteService,
    private readonly cache: ValkeyService,
    private readonly encryptionService: EncryptionService,
  ) {
    this.logger = loggerService.log(this.constructor.name);
  }

  @KafkaEvent(KafkaTopics.event.delete)
  async handleDeleteEvents(
    payload: UserIdDTO,
    context: IKafkaEventContext,
  ): Promise<void> {
    return TraceRunner.run('[HANDLER] delte Events', async () => {
      this.logger.warn('Delete event received');
      this.logger.debug('Payload: %o', payload);

      const headers = context.headers;
      const actorId = headers[KAFKA_HEADERS.ACTOR_ID] ?? 'Unkown';

      await this.eventWriteService.deleteEvents(payload.userId, actorId);
    });
  }

  @KafkaEvent(KafkaTopics.event.addRole)
  async handleAddEventRole(
    payload: CreateUserWithInvitationIdDTO,
  ): Promise<void> {
    return TraceRunner.run('[HANDLER] event.addRole', async () => {
      const { userId, token, invitationId } = payload;

      const decrypted = this.encryptionService.decrypt(token, true);
      const { eventKey } = JSON.parse(decrypted) as GuestSignUpTokenPayload;

      const raw = await this.cache.get(
        ValkeyKey.guestVerificationEvent,
        eventKey,
      );
      if (!raw) {
        throw new Error('Invalid token');
      }

      const input = JSON.parse(raw) as GuestEventKey;

      /**
       * 🔥 Validate invitationId is part of this event
       */
      if (!input.invitationIds.includes(invitationId)) {
        throw new Error('InvitationId not part of event');
      }

      await this.eventWriteService.assignUserToEvent({
        eventId: input.eventId,
        userId,
        eventRole: UserRoleType.GUEST,
        actorId: input.actorId,
      });
    });
  }
}
