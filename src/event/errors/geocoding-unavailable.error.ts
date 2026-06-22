import { BaseGraphQLError } from './base-graphql.error.js';

export class GeocodingUnavailableError extends BaseGraphQLError {
  constructor(reason: 'invalid-response' | 'upstream-failure') {
    super(
      'Address geocoding is temporarily unavailable',
      'GEOCODING_UNAVAILABLE',
      { reason },
    );
  }
}
