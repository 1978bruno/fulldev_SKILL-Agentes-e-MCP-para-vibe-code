// Ping do WebSocket (LLD, "Valores e configuração"): menor que o padrão do Socket.IO, para a queda
// sem fechamento da conexão ser percebida em até 15 s, e não em 45 s.
export const PING_INTERVAL_MS = 10_000;
export const PING_TIMEOUT_MS = 5_000;
