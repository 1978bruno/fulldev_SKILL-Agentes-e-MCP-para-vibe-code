import type { ConversationKind } from "@/app/services/chat-api";
import { ChannelIcon } from "./channel-icon";

type ConversationIntroProps = {
  name: string;
  topic: string | null;
  kind: ConversationKind;
};

// Começo do Canal (ConversationIntro, "Conversa / Lista / Início do canal"): aparece acima da
// primeira Mensagem, ou sozinho num Canal sem Mensagens.
export function ConversationIntro({ name, topic, kind }: ConversationIntroProps) {
  return (
    <div className="flex flex-col items-start gap-1 px-5 pt-8 pb-4">
      <span className="mb-2 flex size-12 items-center justify-center rounded-card bg-surface-inset text-fg">
        <ChannelIcon kind={kind} size={24} />
      </span>
      <h2 className="text-title font-black text-fg">Este é o começo do canal #{name}</h2>
      {topic && <p className="text-body text-fg-muted">{topic}</p>}
    </div>
  );
}
