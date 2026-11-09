export type ErrorCode =
  | 'validation_failed'
  | 'invalid_credentials'
  | 'unauthenticated'
  | 'email_already_exists'
  | 'not_found'
  | 'payload_too_large'
  | 'request_rejected'
  | 'internal_error';

export const ERROR_STATUS: Record<ErrorCode, number> = {
  validation_failed: 400,
  invalid_credentials: 401,
  unauthenticated: 401,
  email_already_exists: 409,
  not_found: 404,
  payload_too_large: 413,
  request_rejected: 400,
  internal_error: 500,
};
