import { MessageSkeletonList } from "@/app/components/message/message-skeleton";

// Fallback das telas logadas enquanto a página lê os dados (Cache Components: a leitura em tempo
// de requisição fica atrás de um Suspense, para a navegação mostrar o shell na hora): os
// esqueletos de "Home / Carregando" (19:1533). O texto escondido é o que o leitor de tela lê.
export default function Loading() {
  return (
    <div role="status" className="flex flex-1 flex-col">
      <MessageSkeletonList />
      <span className="sr-only">Carregando</span>
    </div>
  );
}
