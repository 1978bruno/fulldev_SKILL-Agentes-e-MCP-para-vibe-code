"use client";

import type {
  ClientToServerEvents,
  HandshakeErrorCode,
  ServerToClientEvents,
} from "chat-events";
import { createContext, useContext, useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { redirectToExpiredSession } from "@/app/utils/return-path";

export type RealtimeSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export type RealtimeStatus = "connecting" | "connected" | "disconnected";

type RealtimeContextValue = {
  status: RealtimeStatus;
  // Nulo só antes do primeiro efeito, na renderização do servidor e na hidratação.
  socket: RealtimeSocket | null;
};

const RealtimeContext = createContext<RealtimeContextValue>({
  status: "connecting",
  socket: null,
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
// layout das telas logadas e mantido entre as trocas de Conversa. O estado da conexão também vai
// para o atributo data-realtime, que os testes esperam.
export function RealtimeProvider({ url, children }: RealtimeProviderProps) {
  const [value, setValue] = useState<RealtimeContextValue>({
    status: "connecting",
    socket: null,
  });

  useEffect(() => {
    const socket: RealtimeSocket = io(url, {
      transports: ["websocket"],
      withCredentials: true,
    });
    let retryDelay = RETRY_MIN_MS;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    const setStatus = (status: RealtimeStatus) => setValue({ status, socket });

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
    return () => {
      clearTimeout(retryTimer);
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [url]);

  return (
    <RealtimeContext value={value}>
      <div data-realtime={value.status} className="contents">
        {children}
      </div>
    </RealtimeContext>
  );
}

export function useRealtime(): RealtimeContextValue {
  return useContext(RealtimeContext);
}
