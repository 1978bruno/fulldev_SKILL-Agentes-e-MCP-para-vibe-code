"use client";

import { WifiOff } from "lucide-react";
import { useConnectionBanner } from "@/app/hooks/use-connection-banner";

// Faixa de conexão (Figma, ConnectionBanner; spec da F03, "Telas"): no topo da Casca, quando a
// conexão em tempo real caiu há mais que o atraso. É uma região de status, que o leitor de tela
// anuncia, e não recebe o foco.
export function ConnectionBanner() {
  const isVisible = useConnectionBanner();
  return (
    <div role="status">
      {isVisible ? (
        <p className="flex h-[26px] items-center justify-center gap-2 bg-warning px-4 text-small font-bold text-on-warning">
          <WifiOff aria-hidden size={16} />
          Sem conexão em tempo real. Reconectando…
        </p>
      ) : null}
    </div>
  );
}
