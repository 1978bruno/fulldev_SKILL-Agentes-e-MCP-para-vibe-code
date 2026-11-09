// Fallback das telas logadas enquanto a página lê os dados da Sessão (Cache Components: a leitura
// em tempo de requisição fica atrás de um Suspense, para a navegação mostrar o shell na hora). Os
// desenhos de carregamento da Home e da Conversa entram na F02-T06 e na F02-T07.
export default function Loading() {
  return <div aria-busy="true" className="flex flex-1" />;
}
