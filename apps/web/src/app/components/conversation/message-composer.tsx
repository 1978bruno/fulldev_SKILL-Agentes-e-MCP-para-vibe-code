"use client";

import { SendHorizontal } from "lucide-react";
import { useState } from "react";
import { IconButton } from "@/app/components/ui/icon-button";
import { Kbd } from "@/app/components/ui/kbd";
import { codePointLength, MESSAGE_MAX_LENGTH } from "@/app/utils/message-text";

type MessageComposerProps = {
  conversationName: string;
  // Recebe o texto já sem as pontas; a lista mostra a Mensagem como "enviando" e a fila a grava.
  onSend: (body: string) => void;
};

// Caixa de mensagem (MessageComposer): Enter envia e Shift+Enter quebra a linha. Acima do limite,
// o contador toma o lugar da dica e o envio fica bloqueado. O botão de menções entra na F06.
export function MessageComposer({ conversationName, onSend }: MessageComposerProps) {
  const [text, setText] = useState("");
  const body = text.trim();
  const overLimit = codePointLength(body) - MESSAGE_MAX_LENGTH;
  const canSend = body !== "" && overLimit <= 0;
  const label = `Mensagem para #${conversationName}`;

  function submit() {
    if (!canSend) return;
    onSend(body);
    setText("");
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
          {overLimit > 0 ? (
            <p role="status" className="text-caption text-danger-fg">
              {overLimit === 1
                ? "1 caractere acima do limite"
                : `${overLimit} caracteres acima do limite`}
            </p>
          ) : (
            <p className="hidden items-center gap-1 text-caption text-fg-muted sm:flex">
              <Kbd>Shift</Kbd>+<Kbd>Enter</Kbd>
              <span>para nova linha</span>
            </p>
          )}
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
