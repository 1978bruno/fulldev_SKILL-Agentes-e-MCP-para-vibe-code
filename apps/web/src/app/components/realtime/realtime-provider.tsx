"use client";

import type {
  ClientToServerEvents,
  HandshakeErrorCode,
  ServerToClientEvents,
  SyncEvent,
} from "chat-events";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import type { Message } from "@/app/services/chat-api";
import { messageFromEvent } from "@/app/utils/message-event";
import { rememberMessage } from "@/app/utils/recent-messages";
import { hasAskedToLeave } from "@/app/utils/leaving";
import { redirectToExpiredSession } from "@/app/utils/return-path";

export type RealtimeSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export type RealtimeStatus = "connecting" | "connected" | "disconnected";

export type RealtimeListener = {
  onMessage?: (message: Message) => void;
  onSync?: (event: SyncEvent) => void;
};

type RealtimeContextValue = {
  status: RealtimeStatus;
  // Número da queda atual: cresce cada vez que a aba deixa de estar conectada (a primeira conexão
  // ainda por fazer é a queda 1). A faixa de conexão conta o atraso por queda.
  outage: number;
  // Nulo só antes do primeiro efeito, na renderização do servidor e na hidratação.
  socket: RealtimeSocket | null;
  // Assina os eventos da aba; devolve a função que cancela.
  subscribe: (listener: RealtimeListener) => () => void;
  // As Mensagens de uma Conversa recebidas desde a conexão (spec da F03, "Conexão por aba").
  recentMessages: (conversationId: string) => readonly Message[];
};

const RealtimeContext = createContext<RealtimeContextValue>({
  status: "connecting",
  outage: 0,
  socket: null,
  subscribe: () => () => {},
  recentMessages: () => [],
});

const UNAUTHENTICATED: HandshakeErrorCode = "unauthenticated";

// Intervalo de uma nova tentativa depois de um handshake recusado por outro motivo, igual ao da
// reconexão padrão do cliente do Socket.IO: começa em 1 s e dobra até 5 s.
const RETRY_MIN_MS = 1_000;
const RETRY_MAX_MS = 5_000;

type RealtimeProviderProps = {
  // Endereço público da API do chat, lido no servidor (spec da F03, "Cliente").
  url: string;
  children: React.ReactNode;
};

// Conexão em tempo real da aba (spec da F03, "Cliente", "Conexão por aba"): um socket só, aberto no
// layout das telas logadas e mantido entre as trocas de Conversa. Ele guarda as Mensagens recebidas
// por Conversa e repassa os eventos a quem assina. O estado da conexão também vai para o atributo
// data-realtime, que os testes esperam.
export function RealtimeProvider({ url, children }: RealtimeProviderProps) {
  const [connection, setConnection] = useState<{
    status: RealtimeStatus;
    outage: number;
    socket: RealtimeSocket | null;
  }>({ status: "connecting", outage: 1, socket: null });
  const listeners = useRef(new Set<RealtimeListener>());
  // Um reset que chegou sem ninguém assinando: o histórico ainda montava (Suspense) ou estava
  // entre duas Conversas. A próxima assinatura o recebe.
  const pendingReset = useRef<SyncEvent | null>(null);
  // O último sync da conexão atual. Quem assina depois dele recebe uma cópia sem reset: o buffer
  // de Mensagens já cobre o que chegou desde então.
  const lastSync = useRef<SyncEvent | null>(null);
  const recent = useRef(new Map<string, readonly Message[]>());

  useEffect(() => {
    const socket: RealtimeSocket = io(url, {
      transports: ["websocket"],
      withCredentials: true,
    });
    let retryDelay = RETRY_MIN_MS;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    const setStatus = (status: RealtimeStatus) =>
      setConnection((current) => {
        if (current.status === status && current.socket === socket) return current;
        // Sair do "conectada" abre uma queda nova; entre "conectando" e "desconectada" é a mesma.
        const outage = current.status === "connected" ? current.outage + 1 : current.outage;
        return { status, outage, socket };
      });
    const received = recent.current;

    socket.on("connect", () => {
      retryDelay = RETRY_MIN_MS;
      setStatus("connected");
    });
    socket.on("disconnect", () => {
      lastSync.current = null;
      setStatus("disconnected");
    });
    // A Sessão acabou (LLD, "Sessão e login", "WebSocket"): como um 401 do REST. Na aba que pediu
    // para sair, quem navega é o próprio sair.
    socket.on("session.ended", () => {
      if (!hasAskedToLeave()) void redirectToExpiredSession();
    });
    socket.on("connect_error", (error) => {
      if (error.message === UNAUTHENTICATED) {
        void redirectToExpiredSession();
        return;
      }
      setStatus("disconnected");
      // Uma recusa do handshake (middleware) desliga a reconexão do cliente; a falha da
      // própria conexão, não. Só a primeira precisa de nova tentativa aqui.
      if (!socket.active) {
        retryTimer = setTimeout(() => socket.connect(), retryDelay);
        retryDelay = Math.min(retryDelay * 2, RETRY_MAX_MS);
      }
    });
    socket.on("message.created", ({ message: payload }) => {
      const message = messageFromEvent(payload);
      received.set(
        message.conversationId,
        rememberMessage(received.get(message.conversationId) ?? [], message),
      );
      listeners.current.forEach((listener) => listener.onMessage?.(message));
    });
    socket.on("sync", (event) => {
      lastSync.current = event;
      const syncListeners = [...listeners.current].filter((listener) => listener.onSync);
      pendingReset.current = event.reset && syncListeners.length === 0 ? event : null;
      syncListeners.forEach((listener) => listener.onSync?.(event));
    });

    // O navegador sabe que caiu antes do ping: o socket cai na hora e volta com a rede. O próprio
    // cliente do Socket.IO ignora o offline quando o host é localhost. A desconexão pedida aqui
    // desliga a reconexão automática, e por isso o online conecta de novo.
    const goOffline = () => {
      clearTimeout(retryTimer);
      socket.disconnect();
    };
    const goOnline = () => {
      clearTimeout(retryTimer);
      retryDelay = RETRY_MIN_MS;
      if (!socket.connected) socket.connect();
    };
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);

    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
      clearTimeout(retryTimer);
      socket.removeAllListeners();
      socket.disconnect();
      received.clear();
    };
  }, [url]);

  const subscribe = useCallback((listener: RealtimeListener) => {
    listeners.current.add(listener);
    const pending = pendingReset.current;
    if (pending && listener.onSync) {
      pendingReset.current = null;
      listener.onSync(pending);
    } else if (lastSync.current && listener.onSync) {
      listener.onSync({ ...lastSync.current, reset: false });
    }
    return () => {
      listeners.current.delete(listener);
    };
  }, []);

  const recentMessages = useCallback(
    (conversationId: string): readonly Message[] => recent.current.get(conversationId) ?? [],
    [],
  );

  const value = useMemo(
    () => ({ ...connection, subscribe, recentMessages }),
    [connection, subscribe, recentMessages],
  );

  return (
    <RealtimeContext value={value}>
      <div data-realtime={connection.status} className="contents">
        {children}
      </div>
    </RealtimeContext>
  );
}

export function useRealtime(): RealtimeContextValue {
  return useContext(RealtimeContext);
}
