"use client";

import { Hash } from "lucide-react";
import { useId, useRef, useState } from "react";
import { createChannel } from "@/app/actions/create-channel";
import { Button } from "@/app/components/ui/button";
import { DialogBody, DialogClose, DialogContent, DialogFooter } from "@/app/components/ui/dialog";
import { Field } from "@/app/components/ui/field";
import { Input } from "@/app/components/ui/input";
import { Switch } from "@/app/components/ui/switch";
import type { Conversation } from "@/app/services/chat-api";
import { isValidChannelName, normalizeChannelNameInput, normalizeTopicInput } from "@/app/utils/channel-name";
import { newClientId } from "@/app/utils/client-id";
import { redirectToExpiredSession } from "@/app/utils/return-path";

type Status = "idle" | "sending" | "name_taken" | "failure";

type CreateChannelDialogProps = {
  // Quem abriu o diálogo decide o passo seguinte: abrir o Canal público ou adicionar Pessoas ao
  // privado.
  onCreated: (conversation: Conversation) => void;
};

// Conteúdo do diálogo "Criar canal" ("Diálogos / Criar canal": Padrão, Erro no nome, Enviando e
// Falha ao criar). Monta a cada abertura: o clientId nasce aqui e vale para as novas tentativas
// enquanto o diálogo está aberto (spec da F04, "BFF").
export function CreateChannelDialog({ onCreated }: CreateChannelDialogProps) {
  const [clientId, setClientId] = useState(newClientId);
  const [name, setName] = useState("");
  const [topic, setTopic] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const created = useRef(false);
  const ids = {
    name: useId(),
    topic: useId(),
    hint: useId(),
    error: useId(),
    private: useId(),
    privateHint: useId(),
  };

  const canSubmit = isValidChannelName(name) && status !== "sending";

  // Mudar o que foi preenchido tira o erro anterior; durante o envio, os campos não mudam.
  function clearError() {
    if (status !== "sending") setStatus("idle");
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    setStatus("sending");
    // O Server Action rejeita quando a rede cai no caminho: é a mesma falha da API fora do ar.
    const result = await createChannel(name, topic, isPrivate, clientId).catch(() => ({ kind: "failure" }) as const);
    switch (result.kind) {
      case "ok":
        created.current = true;
        onCreated(result.conversation);
        return;
      case "unauthenticated":
        return redirectToExpiredSession();
      case "name_taken":
        // Digitar no nome volta o status a idle: o nome recusado é sempre o que está no campo.
        setStatus("name_taken");
        return;
      default:
        setStatus("failure");
    }
  }

  const nameError = status === "name_taken" ? `Já existe um canal chamado #${name}.` : undefined;

  return (
    <DialogContent
      title="Criar canal"
      description="Canais organizam a conversa por assunto, projeto ou time."
      dismissible={status !== "sending"}
      onCloseAutoFocus={(event) => {
        // Criado o Canal, o foco vai para a caixa de mensagem da Conversa que abre, e não volta a
        // "Adicionar canal".
        if (created.current) event.preventDefault();
      }}
    >
      <form onSubmit={submit} noValidate>
        <DialogBody>
          <Field
            label="Nome"
            htmlFor={ids.name}
            hint="Minúsculas, sem espaços. Ex.: planejamento-q4"
            hintId={ids.hint}
            error={nameError}
            errorId={ids.error}
          >
            <div className="relative">
              <Hash
                size={16}
                aria-hidden
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted"
              />
              <Input
                id={ids.name}
                value={name}
                // Somente leitura no envio: o que vai para a API é o que está na tela.
                readOnly={status === "sending"}
                autoComplete="off"
                spellCheck={false}
                aria-invalid={nameError ? true : undefined}
                aria-describedby={nameError ? ids.error : ids.hint}
                onChange={(event) => {
                  setName(normalizeChannelNameInput(event.target.value));
                  clearError();
                }}
                className="pl-9"
              />
            </div>
          </Field>
          <Field label="Tópico" optional htmlFor={ids.topic}>
            <Input
              id={ids.topic}
              value={topic}
              readOnly={status === "sending"}
              autoComplete="off"
              onChange={(event) => {
                setTopic(normalizeTopicInput(event.target.value));
                clearError();
              }}
            />
          </Field>
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 flex-1 flex-col">
              <label htmlFor={ids.private} className="text-body font-bold text-fg">
                Tornar privado
              </label>
              <p id={ids.privateHint} className="text-small text-fg-muted">
                Só pessoas convidadas veem e participam de um canal privado.
              </p>
            </div>
            <Switch
              id={ids.private}
              checked={isPrivate}
              disabled={status === "sending"}
              aria-describedby={ids.privateHint}
              onCheckedChange={(checked) => {
                setIsPrivate(checked);
                // Outro tipo é outro Canal: a nova tentativa não pode devolver o do tipo anterior,
                // criado por um envio cuja resposta se perdeu.
                setClientId(newClientId());
                clearError();
              }}
            />
          </div>
          {status === "failure" && (
            <p role="alert" className="text-small text-danger-fg">
              Não foi possível criar o canal. Tente de novo.
            </p>
          )}
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary" disabled={status === "sending"}>
              Cancelar
            </Button>
          </DialogClose>
          <Button type="submit" loading={status === "sending"} disabled={!canSubmit}>
            Criar canal
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
