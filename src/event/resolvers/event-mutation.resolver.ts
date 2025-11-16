import { UnauthorizedException, UseGuards } from '@nestjs/common';
import { Event } from '../models/entities/event.entity.js';
import { EventWriteService } from '../services/event-write.service.js';
import { Args, ID, Mutation, Resolver } from '@nestjs/graphql';
import { CookieAuthGuard } from '../../auth/guards/cookie-auth.guard.js';
import {
  CurrentUser,
  CurrentUserData,
} from '../../auth/decorators/current-user.decorator.js';
import { CreateEventInput } from '../models/inputs/create-event.input.js';
import { UpdateEventInput } from '../models/inputs/update-event.input.js';

@Resolver(() => Event)
export class EventMutationResolver {
  constructor(private readonly service: EventWriteService) {}

  @UseGuards(CookieAuthGuard)
  @Mutation(() => Event, { name: 'createEvent' })
  async create(
    @Args('input') input: CreateEventInput,
    @CurrentUser() currentUser: CurrentUserData,
  ): Promise<Event> {
    if (!currentUser?.id) {
      throw new UnauthorizedException('Not authenticated');
    }
    return this.service.create(
      input,
      currentUser.id,
    ) as unknown as Promise<Event>;
  }

  @Mutation(() => Event, { name: 'updateEvent' })
  update(@Args('input') input: UpdateEventInput): Promise<Event> {
    return this.service.update(input);
  }

  @Mutation(() => Boolean, { name: 'deleteEvent' })
  delete(@Args('id', { type: () => ID }) id: string): Promise<boolean> {
    return this.service.remove(id);
  }
}
