const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (!testDatabaseUrl) {
  throw new Error('TEST_DATABASE_URL é obrigatória para os testes e2e');
}
process.env.DATABASE_URL = testDatabaseUrl;

const testRedisUrl = process.env.TEST_REDIS_URL;
if (!testRedisUrl) {
  throw new Error('TEST_REDIS_URL é obrigatória para os testes e2e');
}
process.env.REDIS_URL = testRedisUrl;
