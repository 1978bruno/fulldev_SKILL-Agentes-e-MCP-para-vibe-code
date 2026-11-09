"use client";

import { ArrowDown } from "lucide-react";

type NewMessagesPillProps = {
  onClick: () => void;
};

// Pílula "Novas mensagens" (Figma, NewMessagesPill; spec da F03, "Rolagem e pílula"): aparece sobre
// o fim da lista quando chega uma Mensagem enquanto a Pessoa lê mais acima, e leva ao fim.
export function NewMessagesPill({ onClick }: NewMessagesPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-7 animate-pop-in items-center gap-2 rounded-pill bg-primary px-3 text-small font-bold text-on-primary shadow-2 hover:bg-primary-hover active:bg-primary-active"
    >
      <ArrowDown aria-hidden size={16} />
      Novas mensagens
    </button>
  );
}
