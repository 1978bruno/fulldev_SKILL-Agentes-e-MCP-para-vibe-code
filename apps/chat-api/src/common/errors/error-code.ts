export type ErrorCode =
  | 'validation_failed'
  | 'not_found'
  | 'payload_too_large'
  | 'request_rejected'
  | 'internal_error';

export const ERROR_STATUS: Record<ErrorCode, number> = {
  validation_failed: 400,
  not_found: 404,
  payload_too_large: 413,
  request_rejected: 400,
  internal_error: 500,
};
