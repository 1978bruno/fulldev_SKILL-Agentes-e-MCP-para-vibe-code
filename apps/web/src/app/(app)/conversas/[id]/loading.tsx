import { ConversationHeaderSkeleton } from "@/app/components/conversation/conversation-header-skeleton";
import { HistoryLoading } from "@/app/components/conversation/history-loading";

// Fallback da troca de Canal (o segmento [id] muda de uma Conversa para outra): o cabeçalho em
// esqueleto e "Histórico carregando", até a Conversa ser lida.
export default function Loading() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ConversationHeaderSkeleton />
      <HistoryLoading />
    </div>
  );
}
