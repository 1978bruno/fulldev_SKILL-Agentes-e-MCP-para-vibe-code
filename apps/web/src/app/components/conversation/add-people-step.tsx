"use client";

import { Search, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { addMembers } from "@/app/actions/add-members";
import { Button } from "@/app/components/ui/button";
import { DialogBody, DialogClose, DialogContent, DialogFooter } from "@/app/components/ui/dialog";
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
  // Depois de adicionar: quem abriu o passo fecha o diálogo.
  onDone: () => void;
};

// Passo "Adicionar pessoas" ("Diálogos / Adicionar pessoas"): busca as Pessoas do workspace pelo
// nome, sem os Membros, e adiciona as escolhidas ao Canal privado (spec da F04, "Passo 'Adicionar
// pessoas'"). Usado depois de criar o Canal e pela lista de Membros. Fechar o diálogo, pelo X, pelo
// Esc ou por "Pular", fica com quem o abriu.
export function AddPeopleStep({ conversation, onDone }: AddPeopleStepProps) {
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState<SearchState>({ kind: "loading" });
  const [chosen, setChosen] = useState<PersonSummary[]>([]);
  const [status, setStatus] = useState<"idle" | "sending" | "failure">("idle");
  // Cada busca ganha um número; a resposta de uma busca mais antiga é descartada.
  const latestSearch = useRef(0);
  const searchId = useId();

  useEffect(() => {
    const id = ++latestSearch.current;
    const timer = setTimeout(async () => {
      const params = new URLSearchParams({ q: query, not_member_of: conversation.id });
      try {
        const response = await fetch(`/api/people?${params.toString()}`);
        if (response.status === 401) return void redirectToExpiredSession();
        if (!response.ok) throw new Error("Falha na busca");
        const people = (await response.json()) as PersonSummary[];
        if (id === latestSearch.current) setSearch({ kind: "ok", people });
      } catch {
        if (id === latestSearch.current) setSearch({ kind: "failure" });
      }
    }, SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [query, conversation.id]);

  const chosenIds = new Set(chosen.map((person) => person.id));
  const results =
    search.kind === "ok" ? search.people.filter((person) => !chosenIds.has(person.id)) : [];
  const isSending = status === "sending";

  async function confirm() {
    if (chosen.length === 0 || isSending) return;
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
      // Fechar abre o Canal: o foco vai para a caixa de mensagem dele, e não volta à barra lateral.
      onCloseAutoFocus={(event) => event.preventDefault()}
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
            onChange={(event) => {
              setQuery(event.target.value);
              setSearch({ kind: "loading" });
            }}
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
                  onClick={() => {
                    setChosen((current) => current.filter((item) => item.id !== person.id));
                    if (status === "failure") setStatus("idle");
                  }}
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
              {results.map((person) => (
                <li key={person.id}>
                  <button
                    type="button"
                    disabled={isSending}
                    aria-label={`Escolher ${person.name}`}
                    onClick={() => {
                      setChosen((current) => [...current, person]);
                      if (status === "failure") setStatus("idle");
                    }}
                    className="flex w-full items-center rounded-item p-2 text-left hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-focus/30 disabled:opacity-50"
                  >
                    <PersonRow person={person} />
                  </button>
                </li>
              ))}
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
        <DialogClose asChild>
          <Button type="button" variant="secondary" disabled={isSending}>
            Pular
          </Button>
        </DialogClose>
        <Button
          type="button"
          loading={isSending}
          disabled={chosen.length === 0 || isSending}
          onClick={() => void confirm()}
        >
          Adicionar
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
