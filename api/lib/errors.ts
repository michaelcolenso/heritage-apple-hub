import { TRPCError, type TRPC_ERROR_CODE_KEY } from "@trpc/server";

export const ErrorCode = {
  badRequest: "BAD_REQUEST",
  unauthorized: "UNAUTHORIZED",
  forbidden: "FORBIDDEN",
  notFound: "NOT_FOUND",
  conflict: "CONFLICT",
  internal: "INTERNAL",
  externalService: "EXTERNAL_SERVICE",
} as const;

export type StableErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

type ErrorCause = {
  stableErrorCode: StableErrorCode;
  detail?: unknown;
};

export function createTrpcError(opts: {
  code: TRPC_ERROR_CODE_KEY;
  message: string;
  stableErrorCode: StableErrorCode;
  cause?: unknown;
}) {
  const errorCause: ErrorCause = {
    stableErrorCode: opts.stableErrorCode,
    detail: opts.cause,
  };

  return new TRPCError({
    code: opts.code,
    message: opts.message,
    cause: errorCause,
  });
}

export function getStableErrorCode(error: unknown): StableErrorCode {
  const cause = (error as { cause?: ErrorCause })?.cause;
  return cause?.stableErrorCode ?? ErrorCode.internal;
}

export function toErrorResponse(message: string, stableErrorCode: StableErrorCode, requestId: string) {
  return {
    error: {
      message,
      code: stableErrorCode,
      requestId,
    },
  };
}
