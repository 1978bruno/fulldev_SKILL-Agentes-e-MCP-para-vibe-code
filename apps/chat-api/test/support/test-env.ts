const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (!testDatabaseUrl) {
  throw new Error('TEST_DATABASE_URL é obrigatória para os testes e2e');
}
process.env.DATABASE_URL = testDatabaseUrl;
