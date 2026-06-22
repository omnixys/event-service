import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

@InputType()
export class GeocodeAddressInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  address!: string;
}
