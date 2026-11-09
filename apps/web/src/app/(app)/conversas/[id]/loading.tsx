// Fallback da Conversa: fica no segmento [id], que muda de uma Conversa para outra, para a troca
// de Canal também mostrar o shell na hora. O desenho "Histórico carregando" entra na F02-T07.
export default function Loading() {
  return <div aria-busy="true" className="flex flex-1" />;
}
