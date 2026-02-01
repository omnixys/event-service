import { Field, InputType } from '@nestjs/graphql';
import { IsString } from 'class-validator';

@InputType()
export class EventAddressInput {
  @Field()
  @IsString()
  street!: string;

  @Field()
  @IsString()
  city!: string;

  @Field()
  @IsString()
  zip!: string;

  @Field()
  @IsString()
  country!: string;
}
