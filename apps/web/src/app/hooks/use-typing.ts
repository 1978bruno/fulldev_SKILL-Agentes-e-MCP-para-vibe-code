"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRealtime } from "@/app/components/realtime/realtime-provider";
import {
  addTyper,
  removeTyper,
  shouldAnnounce,
  type Typer,
  TYPING_EXPIRY_MS,
} from "@/app/utils/typing";

// Abre a Conversa no socket da aba (spec da F03, "Digitando"): ao montar e a cada conexão, e fecha
// ao desmontar.
export function useOpenConversation(conversationId: string) {
  const { socket } = useRealtime();
  useEffect(() => {
    if (!socket) return;
    const open = () =>
      socket.emit("conversation.open", { conversation_id: conversationId }, () => {});
    if (socket.connected) open();
    socket.on("connect", open);
    return () => {
      socket.off("connect", open);
      socket.emit("conversation.close", { conversation_id: conversationId });
    };
  }, [socket, conversationId]);
}

// Os avisos de quem escreve: a caixa de mensagem chama `onTextChange` a cada mudança do texto e
// `onSent` ao enviar; trocar de Conversa avisa que parou.
export function useTypingAnnouncer(conversationId: string) {
  const { socket } = useRealtime();
  const lastAnnouncedAt = useRef<number | null>(null);

  const stop = useCallback(() => {
    if (lastAnnouncedAt.current === null) return;
    lastAnnouncedAt.current = null;
    socket?.emit("typing.stop", { conversation_id: conversationId });
  }, [socket, conversationId]);

  const onTextChange = useCallback(
    (text: string) => {
      const announcement = shouldAnnounce(text, lastAnnouncedAt.current, Date.now());
      if (announcement === "stop") return stop();
      if (announcement === "start") {
        lastAnnouncedAt.current = Date.now();
        socket?.emit("typing.start", { conversation_id: conversationId });
      }
    },
    [socket, conversationId, stop],
  );

  useEffect(() => stop, [stop]);

  return { onTextChange, onSent: stop };
}

// Quem está digitando na Conversa, em ordem de chegada. Cada aviso (re)arma o prazo da
// `expiração do digitando`; o aviso de que parou, o prazo vencido ou a queda da própria conexão
// tiram a Pessoa.
export function useTypingPeople(conversationId: string): readonly Typer[] {
  const { socket } = useRealtime();
  const [typers, setTypers] = useState<readonly Typer[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  useEffect(() => {
    if (!socket) return;
    const pending = timers.current;
    const remove = (personId: string) => {
      clearTimeout(pending.get(personId));
      pending.delete(personId);
      setTypers((current) => removeTyper(current, personId));
    };
    const onStart = ({ conversation_id, person }: { conversation_id: string; person: Typer }) => {
      if (conversation_id !== conversationId) return;
      clearTimeout(pending.get(person.id));
      pending.set(person.id, setTimeout(() => remove(person.id), TYPING_EXPIRY_MS));
      setTypers((current) => addTyper(current, { id: person.id, name: person.name }));
    };
    const onStop = ({ conversation_id, person }: { conversation_id: string; person: Typer }) => {
      if (conversation_id === conversationId) remove(person.id);
    };
    // A queda da própria conexão esvazia a lista: os avisos que faltarem não chegam.
    const clear = () => {
      pending.forEach(clearTimeout);
      pending.clear();
      setTypers([]);
    };
    socket.on("typing.start", onStart);
    socket.on("typing.stop", onStop);
    socket.on("disconnect", clear);
    return () => {
      socket.off("typing.start", onStart);
      socket.off("typing.stop", onStop);
      socket.off("disconnect", clear);
      clear();
    };
  }, [socket, conversationId]);

  return typers;
}
