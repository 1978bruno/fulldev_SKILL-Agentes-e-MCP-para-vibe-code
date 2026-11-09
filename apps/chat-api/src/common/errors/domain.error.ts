import { ErrorCode } from './error-code';

export abstract class DomainError extends Error {
  abstract readonly code: ErrorCode;
  // Quando a recusa é temporária, em quantos segundos tentar de novo; o filter o traduz no
  // cabeçalho Retry-After, sem conhecer o erro concreto.
  readonly retryAfterSeconds?: number;
}
