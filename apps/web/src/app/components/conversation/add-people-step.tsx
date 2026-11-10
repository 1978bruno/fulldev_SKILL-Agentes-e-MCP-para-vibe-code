"use client";

import { Check, Search, X } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { addMembers } from "@/app/actions/add-members";
import { Button } from "@/app/components/ui/button";
import { DialogBody, DialogContent, DialogFooter } from "@/app/components/ui/dialog";
import { IconButton } from "@/app/components/ui/icon-button";
import { Input } from "@/app/components/ui/input";
import { PersonRow } from "@/app/components/user/person-row";
import type { PersonSummary } from "@/app/services/chat-api";
import { redirectToExpiredSession } from "@/app/utils/return-path";

// Espera da busca de Pessoas (LLD, "Valores e configuração").
const SEARCH_DELAY_MS = 200;

type SearchState =
  | { kind: "loading" }
  | { kind: "ok"; people: PersonSummary[] }
  | { kind: "failure" };

type AddPeopleStepProps = {
  conversation: { id: string; name: string };
  // Depois de adicionar: quem abriu o passo decide o que vem (abrir o Canal, voltar à lista).
  onDone: () => void;
  // O botão secundário: "Pular", que fecha o diálogo, na criação; "Voltar", na lista de Membros.
  secondary: { label: string; onClick: () => void };
  onCloseAutoFocus?: (event: Event) => void;
};

// Passo "Adicionar pessoas" ("Diálogos / Adicionar pessoas"): busca as Pessoas do workspace pelo
// nome, sem os Membros, e adiciona as escolhidas ao Canal privado (spec da F04, "Passo 'Adicionar
// pessoas'"). Usado depois de criar o Canal e pela lista de Membros. Fechar o diálogo, pelo X, pelo
// Esc ou por "Pular", fica com quem o abriu.
export function AddPeopleStep({
  conversation,
  onDone,
  secondary,
  onCloseAutoFocus,
}: AddPeopleStepProps) {
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState<SearchState>({ kind: "loading" });
  const [chosen, setChosen] = useState<PersonSummary[]>([]);
  const [status, setStatus] = useState<"idle" | "sending" | "failure">("idle");
  const searchId = useId();

  // Uma busca nova cancela a anterior, esperando ou em andamento: só a resposta da última vale.
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      const params = new URLSearchParams({ q: query, not_member_of: conversation.id });
      try {
        const response = await fetch(`/api/people?${params.toString()}`, {
          signal: controller.signal,
        });
        if (response.status === 401) return void redirectToExpiredSession();
        if (!response.ok) throw new Error("Falha na busca");
        const people = (await response.json()) as PersonSummary[];
        // A busca pode ter sido trocada por outra depois de responder: só a última vale.
        if (!controller.signal.aborted) setSearch({ kind: "ok", people });
      } catch {
        if (!controller.signal.aborted) setSearch({ kind: "failure" });
      }
    }, SEARCH_DELAY_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, conversation.id]);

  const chosenIds = new Set(chosen.map((person) => person.id));
  // As escolhidas continuam nos resultados, marcadas: a busca devolve no máximo 20, e tirá-las da
  // lista a esvaziaria.
  const results = search.kind === "ok" ? search.people : [];
  const isSending = status === "sending";
  const canAdd = chosen.length > 0 && !isSending;

  // Mudar as escolhidas tira a falha anterior.
  function updateChosen(next: (current: PersonSummary[]) => PersonSummary[]) {
    setChosen(next);
    if (status === "failure") setStatus("idle");
  }

  async function confirm() {
    if (!canAdd) return;
    setStatus("sending");
    const result = await addMembers(
      conversation.id,
      chosen.map((person) => person.id),
    ).catch(() => ({ kind: "failure" }) as const);
    if (result.kind === "ok") return onDone();
    if (result.kind === "unauthenticated") return redirectToExpiredSession();
    setStatus("failure");
  }

  return (
    <DialogContent
      title={`Adicionar pessoas ao #${conversation.name}`}
      description="Só quem está no canal vê as mensagens dele."
      dismissible={!isSending}
      onCloseAutoFocus={onCloseAutoFocus}
    >
      <DialogBody>
        <div className="relative">
          <label htmlFor={searchId} className="sr-only">
            Buscar pessoas
          </label>
          <Search
            size={16}
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted"
          />
          <Input
            id={searchId}
            type="search"
            value={query}
            placeholder="Buscar por nome"
            autoComplete="off"
            readOnly={isSending}
            // Os resultados anteriores ficam na tela até a busca nova responder.
            onChange={(event) => setQuery(event.target.value)}
            className="pl-9"
          />
        </div>
        {chosen.length > 0 && (
          <ul aria-label="Escolhidas" className="flex flex-wrap gap-2">
            {chosen.map((person) => (
              <li
                key={person.id}
                className="flex items-center gap-1 rounded-pill bg-surface-subtle py-0.5 pl-3 pr-1 text-small font-bold text-fg"
              >
                {person.name}
                <IconButton
                  icon={X}
                  label={`Tirar ${person.name}`}
                  size="sm"
                  disabled={isSending}
                  onClick={() =>
                    updateChosen((current) => current.filter((item) => item.id !== person.id))
                  }
                />
              </li>
            ))}
          </ul>
        )}
        <div aria-live="polite" className="flex max-h-72 flex-col overflow-y-auto">
          {search.kind === "failure" && (
            <p className="px-2 py-3 text-small text-danger-fg">
              Não foi possível buscar as pessoas.
            </p>
          )}
          {search.kind === "ok" && results.length === 0 && (
            <p className="px-2 py-3 text-body text-fg-muted">Ninguém encontrado com esse nome.</p>
          )}
          {results.length > 0 && (
            <ul aria-label="Pessoas" className="flex flex-col">
              {results.map((person) => {
                const isChosen = chosenIds.has(person.id);
                return (
                  <li key={person.id}>
                    <button
                      type="button"
                      disabled={isSending}
                      // O nome visível é o nome acessível; aria-pressed diz se ela está escolhida.
                      aria-pressed={isChosen}
                      onClick={() =>
                        updateChosen((current) =>
                          isChosen
                            ? current.filter((item) => item.id !== person.id)
                            : [...current, person],
                        )
                      }
                      className="flex w-full items-center gap-3 rounded-item p-2 text-left hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-focus/30 disabled:opacity-50"
                    >
                      <PersonRow person={person} />
                      {isChosen && <Check size={18} aria-hidden className="shrink-0 text-primary" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        {status === "failure" && (
          <p role="alert" className="text-small text-danger-fg">
            Não foi possível adicionar as pessoas. Tente de novo.
          </p>
        )}
      </DialogBody>
      <DialogFooter>
        <Button type="button" variant="secondary" disabled={isSending} onClick={secondary.onClick}>
          {secondary.label}
        </Button>
        <Button
          type="button"
          loading={isSending}
          disabled={!canAdd}
          onClick={() => void confirm()}
        >
          Adicionar
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
