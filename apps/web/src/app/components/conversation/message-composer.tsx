"use client";

import { SendHorizontal } from "lucide-react";
import { useState, useTransition } from "react";
import { sendMessage } from "@/app/actions/send-message";
import { IconButton } from "@/app/components/ui/icon-button";
import { Kbd } from "@/app/components/ui/kbd";
import type { Message } from "@/app/services/chat-api";
import { newClientId } from "@/app/utils/client-id";
import { expiredSessionPath } from "@/app/utils/return-path";

type MessageComposerProps = {
  conversationId: string;
  conversationName: string;
  onSent: (message: Message) => void;
};

// Caixa de mensagem (MessageComposer): Enter envia e Shift+Enter quebra a linha. Os estados
// "enviando" e "falhou", a fila e o limite de caracteres entram na F02-T05; o botão de menções,
// na F06.
export function MessageComposer({
  conversationId,
  conversationName,
  onSent,
}: MessageComposerProps) {
  const [text, setText] = useState("");
  const [isPending, startTransition] = useTransition();
  const canSend = text.trim() !== "" && !isPending;
  const label = `Mensagem para #${conversationName}`;

  function submit() {
    if (!canSend) return;
    const body = text;
    const clientId = newClientId();
    startTransition(async () => {
      const result = await sendMessage(conversationId, clientId, body);
      if (result.kind === "ok") {
        onSent(result.message);
        // Só esvazia se a Pessoa não escreveu mais nada enquanto o envio corria.
        setText((current) => (current === body ? "" : current));
      } else if (result.kind === "unauthenticated") {
        window.location.assign(expiredSessionPath(window.location.pathname));
      }
    });
  }

  return (
    <div className="shrink-0 px-5 pb-5">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
        className="flex flex-col rounded-card border border-border-strong bg-surface focus-within:outline-2 focus-within:outline-focus"
      >
        <div className="flex px-3 pt-3 pb-1">
          <textarea
            aria-label={label}
            placeholder={label}
            rows={1}
            autoFocus
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                event.preventDefault();
                submit();
              }
            }}
            className="field-sizing-content max-h-60 min-h-[22px] flex-1 resize-none bg-transparent text-body text-fg outline-none placeholder:text-fg-subtle"
          />
        </div>
        <div className="flex items-center justify-end gap-3 p-1.5">
          <p className="hidden items-center gap-1 text-caption text-fg-muted sm:flex">
            <Kbd>Shift</Kbd>+<Kbd>Enter</Kbd>
            <span>para nova linha</span>
          </p>
          <IconButton
            type="submit"
            icon={SendHorizontal}
            label="Enviar mensagem"
            size="sm"
            className="w-9"
            disabled={!canSend}
          />
        </div>
      </form>
    </div>
  );
}
