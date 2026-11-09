"use client";

import { Hash } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";
import { createChannel } from "@/app/actions/create-channel";
import { Button } from "@/app/components/ui/button";
import { DialogBody, DialogClose, DialogContent, DialogFooter } from "@/app/components/ui/dialog";
import { Field } from "@/app/components/ui/field";
import { Input } from "@/app/components/ui/input";
import { isValidChannelName, normalizeChannelNameInput, normalizeTopicInput } from "@/app/utils/channel-name";
import { newClientId } from "@/app/utils/client-id";
import { redirectToExpiredSession } from "@/app/utils/return-path";

type Status = "idle" | "sending" | "name_taken" | "failure";

type CreateChannelDialogProps = {
  onCreated: () => void;
};

// Conteúdo do diálogo "Criar canal" ("Diálogos / Criar canal": Padrão, Erro no nome, Enviando e
// Falha ao criar). Monta a cada abertura: o clientId nasce aqui e vale para as novas tentativas
// enquanto o diálogo está aberto (spec da F04, "BFF").
export function CreateChannelDialog({ onCreated }: CreateChannelDialogProps) {
  const router = useRouter();
  const [clientId] = useState(newClientId);
  const [name, setName] = useState("");
  const [topic, setTopic] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  // O nome que a API recusou como repetido, para a frase do erro.
  const [takenName, setTakenName] = useState("");
  const created = useRef(false);
  const ids = { name: useId(), topic: useId(), hint: useId(), error: useId() };

  const canSubmit = isValidChannelName(name) && status !== "sending";

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    setStatus("sending");
    // O Server Action rejeita quando a rede cai no caminho: é a mesma falha da API fora do ar.
    const result = await createChannel(name, topic, clientId).catch(() => ({ kind: "failure" }) as const);
    switch (result.kind) {
      case "ok":
        created.current = true;
        onCreated();
        router.push(`/conversas/${result.conversation.id}`);
        // A barra lateral é renderizada no servidor: o refresh a traz com o Canal novo.
        router.refresh();
        return;
      case "unauthenticated":
        return redirectToExpiredSession();
      case "name_taken":
        setTakenName(name);
        setStatus("name_taken");
        return;
      default:
        setStatus("failure");
    }
  }

  const nameError = status === "name_taken" ? `Já existe um canal chamado #${takenName}.` : undefined;

  return (
    <DialogContent
      title="Criar canal"
      description="Canais organizam a conversa por assunto, projeto ou time."
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
                autoComplete="off"
                spellCheck={false}
                aria-invalid={nameError ? true : undefined}
                aria-describedby={nameError ? ids.error : ids.hint}
                onChange={(event) => {
                  setName(normalizeChannelNameInput(event.target.value));
                  if (status === "name_taken") setStatus("idle");
                }}
                className="pl-9"
              />
            </div>
          </Field>
          <Field label="Tópico" optional htmlFor={ids.topic}>
            <Input
              id={ids.topic}
              value={topic}
              autoComplete="off"
              onChange={(event) => setTopic(normalizeTopicInput(event.target.value))}
            />
          </Field>
          {status === "failure" && (
            <p role="alert" className="text-small text-danger-fg">
              Não foi possível criar o canal. Tente de novo.
            </p>
          )}
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
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
