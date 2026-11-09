import { MessageSkeletonList } from "@/app/components/message/message-skeleton";
import { HeaderlessScreen } from "@/app/components/workspace-nav/headerless-screen";

// Fallback das telas logadas enquanto a página lê os dados (Cache Components: a leitura em tempo
// de requisição fica atrás de um Suspense, para a navegação mostrar o shell na hora): os
// esqueletos de "Home / Carregando" (19:1533).
export default function Loading() {
  return (
    <HeaderlessScreen className="flex-col">
      <MessageSkeletonList label="Carregando" />
    </HeaderlessScreen>
  );
}
