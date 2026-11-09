import { MessageSkeletonList } from "@/app/components/message/message-skeleton";
import { MessageComposer } from "./message-composer";

// "Conversa / Histórico carregando" (21:1869): os esqueletos no lugar das Mensagens e a caixa de
// mensagem desabilitada até a primeira página chegar. O texto escondido é o que o leitor de tela lê.
export function HistoryLoading({ conversationName }: { conversationName?: string }) {
  return (
    <>
      <div role="status" className="flex min-h-0 flex-1 flex-col">
        <MessageSkeletonList />
        <span className="sr-only">Carregando as mensagens</span>
      </div>
      <MessageComposer conversationName={conversationName} />
    </>
  );
}
