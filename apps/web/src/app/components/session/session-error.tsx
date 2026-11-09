"use client";

import { WifiOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/app/components/ui/button";
import { EmptyState } from "@/app/components/ui/empty-state";

// "Portas / Erro de sessão": a verificação falhou por rede, 5xx ou tempo esgotado. O cookie fica,
// e "Tentar de novo" refaz a renderização da rota, que verifica a Sessão de novo.
export function SessionError() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <main className="flex h-screen items-center justify-center bg-surface">
      <EmptyState
        titleAs="h1"
        announce
        icon={WifiOff}
        title="Não foi possível verificar sua sessão"
        description="Confira sua conexão e tente de novo."
        action={
          <Button loading={isPending} onClick={() => startTransition(() => router.refresh())}>
            Tentar de novo
          </Button>
        }
      />
    </main>
  );
}
