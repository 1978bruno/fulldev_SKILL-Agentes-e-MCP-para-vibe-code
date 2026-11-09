import { WifiOff } from "lucide-react";
import { EmptyState } from "@/app/components/ui/empty-state";
import { RetryButton } from "@/app/components/ui/retry-button";

// "Portas / Erro de sessão": a verificação falhou por rede, 5xx ou tempo esgotado. O cookie fica,
// e "Tentar de novo" refaz a renderização da rota, que verifica a Sessão de novo.
const TITLE = "Não foi possível verificar sua sessão";
const DESCRIPTION = "Confira sua conexão e tente de novo.";

export function SessionError() {
  return (
    <main className="flex h-screen items-center justify-center bg-surface">
      <EmptyState
        titleAs="h1"
        icon={WifiOff}
        title={TITLE}
        description={DESCRIPTION}
        action={<RetryButton announce={`${TITLE}. ${DESCRIPTION}`} />}
      />
    </main>
  );
}
