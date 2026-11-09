import { Controller, Get, INestApplication, Logger } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from './support/create-test-app';

@Controller('falha')
class FailingController {
  @Get()
  fail(): never {
    throw new Error('detalhe interno: senha do banco vazou');
  }
}

describe('formato de erro', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp({ controllers: [FailingController] });
  });

  afterAll(async () => {
    await app.close();
  });

  it('responde 404 em problem+json com o code not_found numa rota inexistente', async () => {
    const response = await request(app.getHttpServer() as App).get(
      '/v1/rota-inexistente',
    );

    expect(response.status).toBe(404);
    expect(response.headers['content-type']).toContain(
      'application/problem+json',
    );
    expect(response.body).toMatchObject({ status: 404, code: 'not_found' });
  });

  it('responde 500 sem a mensagem interna nem stack trace e registra o erro em log', async () => {
    const logError = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);

    const response = await request(app.getHttpServer() as App).get('/v1/falha');

    expect(response.status).toBe(500);
    expect(response.body).toMatchObject({
      status: 500,
      code: 'internal_error',
    });
    expect(JSON.stringify(response.body)).not.toContain('detalhe interno');
    expect(JSON.stringify(response.body)).not.toContain('at ');
    expect(logError).toHaveBeenCalled();
    logError.mockRestore();
  });
});
