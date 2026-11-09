"use client";

import { WifiOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useTransition } from "react";
import { Button } from "@/app/components/ui/button";
import { EmptyState } from "@/app/components/ui/empty-state";

// "Portas / Erro de sessão": a verificação falhou por rede, 5xx ou tempo esgotado. O cookie fica,
// e "Tentar de novo" refaz a renderização da rota, que verifica a Sessão de novo.
const TITLE = "Não foi possível verificar sua sessão";
const DESCRIPTION = "Confira sua conexão e tente de novo.";

export function SessionError() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const liveRef = useRef<HTMLParagraphElement>(null);

  // O texto vem do servidor já pronto, e um leitor de tela não anuncia conteúdo que estava lá na
  // carga. A região live é preenchida no cliente, depois de montar e a cada tentativa que termina
  // de novo nesta tela, para a falha ser anunciada.
  useEffect(() => {
    const region = liveRef.current;
    if (!region || isPending) return;
    region.textContent = "";
    const frame = requestAnimationFrame(() => {
      region.textContent = `${TITLE}. ${DESCRIPTION}`;
    });
    return () => cancelAnimationFrame(frame);
  }, [isPending]);

  return (
    <main className="flex h-screen items-center justify-center bg-surface">
      <EmptyState
        titleAs="h1"
        icon={WifiOff}
        title={TITLE}
        description={DESCRIPTION}
        action={
          <Button loading={isPending} onClick={() => startTransition(() => router.refresh())}>
            Tentar de novo
          </Button>
        }
      />
      <p ref={liveRef} role="alert" className="sr-only" />
    </main>
  );
}
