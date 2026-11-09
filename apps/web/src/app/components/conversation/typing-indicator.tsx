import type { Typer } from "@/app/utils/typing";
import { typingLabel } from "@/app/utils/typing";

// Linha do "digitando" (Figma, "Conversa / Lista / Digitando"): reservada acima da caixa de
// mensagem, com a mesma altura com ou sem texto. Não é região aria-live, para não anunciar cada
// aviso ao leitor de tela (spec da F03, "Telas").
export function TypingIndicator({ typers }: { typers: readonly Typer[] }) {
  return (
    <p className="h-5 shrink-0 truncate px-5 text-caption text-fg-muted">{typingLabel(typers)}</p>
  );
}
