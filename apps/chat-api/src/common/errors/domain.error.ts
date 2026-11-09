import { ErrorCode } from './error-code';

export abstract class DomainError extends Error {
  abstract readonly code: ErrorCode;
}
