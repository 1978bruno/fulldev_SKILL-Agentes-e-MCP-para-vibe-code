import { Avatar } from "@/app/components/ui/avatar";
import type { Message } from "@/app/services/chat-api";
import { formatTime } from "@/app/utils/format-time";

type MessageItemProps = {
  message: Message;
};

// Mensagem no layout completo (MessageItem, "full"): avatar, nome, hora e texto. O compacto, os
// estados "enviando" e "falhou" e a barra de ações entram nas tarefas seguintes da F02 e na F06.
export function MessageItem({ message }: MessageItemProps) {
  return (
    <li className="mt-2 flex gap-2 px-5 py-1">
      <div className="flex w-9 shrink-0 justify-end">
        <Avatar initials={message.author.initials} seed={message.author.id} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="flex items-baseline gap-2">
          <span className="text-body font-black text-fg">{message.author.name}</span>
          <time dateTime={message.createdAt} className="text-caption text-fg-muted">
            {formatTime(message.createdAt)}
          </time>
        </p>
        <p className="whitespace-pre-wrap break-words text-body text-fg">{message.body}</p>
      </div>
    </li>
  );
}
