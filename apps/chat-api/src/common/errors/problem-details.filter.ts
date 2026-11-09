import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { DomainError } from './domain.error';
import { ERROR_STATUS, ErrorCode } from './error-code';

const TITLES: Record<number, string> = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  409: 'Conflict',
  413: 'Payload Too Large',
  415: 'Unsupported Media Type',
  422: 'Unprocessable Entity',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
};

const DETAILS: Record<ErrorCode, string> = {
  validation_failed: 'Os dados enviados são inválidos.',
  not_found: 'Recurso não encontrado.',
  payload_too_large: 'O corpo da requisição é grande demais.',
  request_rejected: 'A requisição foi recusada.',
  internal_error: 'Erro interno. Tente novamente mais tarde.',
};

interface Resolved {
  status: number;
  code: ErrorCode;
  detail: string;
}

@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemDetailsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { status, code, detail } = this.resolve(exception);
    const body = {
      type: 'about:blank',
      title: TITLES[status] ?? 'Error',
      status,
      detail,
      code,
    };
    const response = host.switchToHttp().getResponse<unknown>();
    const adapter = this.httpAdapterHost.httpAdapter;
    adapter.setHeader(response, 'Content-Type', 'application/problem+json');
    adapter.reply(response, JSON.stringify(body), status);
  }

  private resolve(exception: unknown): Resolved {
    if (exception instanceof DomainError) {
      return {
        status: ERROR_STATUS[exception.code],
        code: exception.code,
        detail: exception.message,
      };
    }
    if (exception instanceof HttpException && exception.getStatus() < 500) {
      return this.fromStatus(
        exception.getStatus(),
        exception instanceof BadRequestException,
      );
    }
    const bodyReaderStatus = this.bodyReaderStatus(exception);
    if (bodyReaderStatus !== undefined) {
      return this.fromStatus(bodyReaderStatus, bodyReaderStatus === 400);
    }
    this.logger.error(
      exception instanceof Error ? exception.message : String(exception),
      exception instanceof Error ? exception.stack : undefined,
    );
    return this.build(500, 'internal_error');
  }

  private fromStatus(status: number, isBadRequest: boolean): Resolved {
    if (status === 404) return this.build(404, 'not_found');
    if (status === 413) return this.build(413, 'payload_too_large');
    if (isBadRequest || status === 400)
      return this.build(400, 'validation_failed');
    return this.build(status, 'request_rejected');
  }

  private build(status: number, code: ErrorCode): Resolved {
    return { status, code, detail: DETAILS[code] };
  }

  // Erros do leitor do corpo do Express (JSON malformado, corpo grande) trazem
  // `type` e `status`; qualquer outro erro com `statusCode` próprio é inesperado.
  private bodyReaderStatus(exception: unknown): number | undefined {
    if (typeof exception !== 'object' || exception === null) return undefined;
    const { type, status } = exception as { type?: unknown; status?: unknown };
    if (
      typeof type === 'string' &&
      type.startsWith('entity.') &&
      typeof status === 'number' &&
      status >= 400 &&
      status < 500
    ) {
      return status;
    }
    return undefined;
  }
}
