import { GraphQLError } from 'graphql';

/**
 * BaseGraphQLError
 *
 * Central abstraction for all domain-specific GraphQL errors.
 * Ensures consistent structure for Apollo Client error handling.
 */
export class BaseGraphQLError extends GraphQLError {
  constructor(
    message: string,
    code: string,
    details?: Record<string, unknown>,
  ) {
    super(message, {
      extensions: {
        code,
        ...details,
      },
    });
  }
}
