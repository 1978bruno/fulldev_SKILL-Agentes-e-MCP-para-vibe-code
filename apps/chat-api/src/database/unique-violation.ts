import { QueryFailedError } from 'typeorm';

// Violação de unicidade do Postgres (23505): duas gravações simultâneas que passaram pela
// conferência prévia, e o índice único decide.
export function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof QueryFailedError &&
    (error.driverError as { code?: string } | undefined)?.code === '23505'
  );
}
