// Ping do WebSocket (LLD, "Valores e configuração"): menor que o padrão do Socket.IO, para a queda
// sem fechamento da conexão ser percebida em até 15 s, e não em 45 s.
export const PING_INTERVAL_MS = 10_000;
export const PING_TIMEOUT_MS = 5_000;

// Intervalo de reconferência da Sessão no WebSocket (LLD, "Valores e configuração"): o teto entre
// a Sessão ser revogada ou vencer e as abas dela pararem de receber eventos.
export const SESSION_RECHECK_INTERVAL_MS = 60_000;

// Retenção dos eventos de reconexão (LLD, "Valores e configuração"; PRD da F03, história 5): cada
// gravação corta os eventos da Pessoa mais velhos que isso.
export const EVENTS_RETENTION_MS = 5 * 60_000;
