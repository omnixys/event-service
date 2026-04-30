import { MediaType } from '../../../prisma/generated/client.js';
import { Field, InputType, registerEnumType } from '@nestjs/graphql';

@InputType()
export class CreateMediaDto {
  @Field()
  filename!: string;

  @Field()
  mimetype!: string;

  @Field()
  key!: string;

  @Field()
  url!: string;

  @Field()
  size?: number;

  @Field()
  eventId!: string;

  @Field(() => MediaType)
  type!: MediaType;
}

registerEnumType(MediaType, { name: 'MediaType' });

@InputType()
export class DeleteMediaDto {
  @Field()
  id!: string;
}
