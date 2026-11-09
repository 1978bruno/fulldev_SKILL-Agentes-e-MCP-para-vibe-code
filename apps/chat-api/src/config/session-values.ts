// Intervalo de renovação da Sessão (LLD, "Valores e configuração"): constante, no máximo uma
// escrita por Sessão a cada intervalo. A duração da Sessão (SESSION_TTL_DAYS) tem de ser maior
// que ele, senão a Sessão vence antes de poder ser renovada.
export const RENEWAL_INTERVAL_DAYS = 1;
