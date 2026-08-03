import { ContextAccessor } from '@omnixys/context-ts';
import {
  FrameworkException,
  type FrameworkExceptionOptions,
} from '@omnixys/contracts-ts';

/**
 * BaseGraphQLError
 *
 * Central abstraction for all domain-specific GraphQL errors.
 * Ensures consistent structure for Apollo Client error handling.
 */
export class BaseGraphQLError extends FrameworkException {
  constructor(
    message: string,
    code: string,
    details?: Record<string, unknown>,
  ) {
    super(code, message, currentErrorOptions(details));
  }
}

export function currentErrorOptions(
  metadata: Readonly<Record<string, unknown>> = {},
  cause?: unknown,
): FrameworkExceptionOptions {
  const context = ContextAccessor.get();
  return {
    cause,
    context: {
      requestId: context?.requestId,
      correlationId: context?.correlationId,
      traceId: context?.trace?.traceId,
      actorId: context?.principal?.actorId,
      tenantId: context?.tenant?.tenantId ?? context?.principal?.tenantId,
    },
    metadata,
  };
}
