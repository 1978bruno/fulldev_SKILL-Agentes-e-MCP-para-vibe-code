import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Person } from '../people/person.entity';
import type { AuthenticatedRequest } from './auth.guard';

export const CurrentPerson = createParamDecorator(
  (_data: unknown, context: ExecutionContext): Person =>
    context.switchToHttp().getRequest<AuthenticatedRequest>().person,
);
