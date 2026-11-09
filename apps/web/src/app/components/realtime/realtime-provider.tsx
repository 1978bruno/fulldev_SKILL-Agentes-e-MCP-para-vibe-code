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
import { redirectToExpiredSession } from "@/app/utils/return-path";

export type RealtimeSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export type RealtimeStatus = "connecting" | "connected" | "disconnected";

export type RealtimeListener = {
  onMessage?: (message: Message) => void;
  onSync?: (event: SyncEvent) => void;
};

type RealtimeContextValue = {
  status: RealtimeStatus;
  // Nulo só antes do primeiro efeito, na renderização do servidor e na hidratação.
  socket: RealtimeSocket | null;
  // Assina os eventos da aba; devolve a função que cancela.
  subscribe: (listener: RealtimeListener) => () => void;
  // As Mensagens de uma Conversa recebidas desde a conexão (spec da F03, "Conexão por aba").
  recentMessages: (conversationId: string) => Message[];
};

const RealtimeContext = createContext<RealtimeContextValue>({
  status: "connecting",
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
    socket: RealtimeSocket | null;
  }>({ status: "connecting", socket: null });
  const listeners = useRef(new Set<RealtimeListener>());
  const recent = useRef(new Map<string, Message[]>());

  useEffect(() => {
    const socket: RealtimeSocket = io(url, {
      transports: ["websocket"],
      withCredentials: true,
    });
    let retryDelay = RETRY_MIN_MS;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    const setStatus = (status: RealtimeStatus) => setConnection({ status, socket });
    const received = recent.current;

    socket.on("connect", () => {
      retryDelay = RETRY_MIN_MS;
      setStatus("connected");
    });
    socket.on("disconnect", () => setStatus("disconnected"));
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
      listeners.current.forEach((listener) => listener.onSync?.(event));
    });

    return () => {
      clearTimeout(retryTimer);
      socket.removeAllListeners();
      socket.disconnect();
      received.clear();
    };
  }, [url]);

  const subscribe = useCallback((listener: RealtimeListener) => {
    listeners.current.add(listener);
    return () => {
      listeners.current.delete(listener);
    };
  }, []);

  const recentMessages = useCallback(
    (conversationId: string) => recent.current.get(conversationId) ?? [],
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
