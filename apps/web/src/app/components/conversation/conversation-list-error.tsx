import { EmptyState } from "@/app/components/ui/empty-state";
import { RetryButton } from "@/app/components/ui/retry-button";
import { HeaderlessScreen } from "@/app/components/workspace-nav/headerless-screen";

// "Conversa / Erro ao carregar a lista" (26:46375): a lista de Conversas não carregou, e a Home
// não sabe para onde ir. O título é o do frame. "Tentar de novo" renderiza a rota de novo.
export function ConversationListError() {
  return (
    <HeaderlessScreen className="items-center justify-center">
      <EmptyState
        titleAs="h1"
        title="Não foi possível carregar a conversa"
        description="Verifique sua conexão e tente de novo."
        action={<RetryButton />}
      />
    </HeaderlessScreen>
  );
}
