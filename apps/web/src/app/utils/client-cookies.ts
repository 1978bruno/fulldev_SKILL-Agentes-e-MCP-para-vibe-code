// Validade dos cookies gravados pelo BFF e pelo cliente: 400 dias, o teto do Chrome (LLD,
// "Valores e configuração", "Validade do cookie de sessão").
export const COOKIE_MAX_AGE_SECONDS = 400 * 24 * 60 * 60;
