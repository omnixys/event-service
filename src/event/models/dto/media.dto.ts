import { Field, InputType } from "@nestjs/graphql";

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
  eventId?: string;
}

@InputType()
export class DeleteMediaDto {
  @Field()
  id!: string;
}
