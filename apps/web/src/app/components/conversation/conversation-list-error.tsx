"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { EmptyState } from "@/app/components/ui/empty-state";

// "Conversa / Erro ao carregar a lista" (26:46375): a lista de Conversas não carregou, e a Home
// não sabe para onde ir. "Tentar de novo" renderiza a rota de novo.
export function ConversationListError() {
  const router = useRouter();
  return (
    <div className="flex flex-1 items-center justify-center">
      <EmptyState
        titleAs="h1"
        title="Não foi possível carregar a conversa"
        description="Verifique sua conexão e tente de novo."
        action={<Button onClick={() => router.refresh()}>Tentar de novo</Button>}
      />
    </div>
  );
}
