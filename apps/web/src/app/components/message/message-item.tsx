import { Avatar } from "@/app/components/ui/avatar";
import type { Message } from "@/app/services/chat-api";
import { formatTime } from "@/app/utils/format-time";
import { DayDivider } from "./day-divider";
import { MessageBody } from "./message-body";

type MessageItemProps = {
  message: Message;
  timeZone: string;
  // Forma compacta (22:7404): sem avatar nem nome, com a hora na calha ao passar o mouse.
  compact?: boolean;
  // Rótulo do divisor de dia, na primeira Mensagem de cada dia.
  dayLabel?: string;
};

// Mensagem (MessageItem), no layout completo ou compacto. Os estados "enviando" e "falhou" e a
// barra de ações entram na F02-T05 e na F06.
export function MessageItem({ message, timeZone, compact = false, dayLabel }: MessageItemProps) {
  return (
    <li className="flex flex-col">
      {dayLabel && <DayDivider label={dayLabel} />}
      {compact ? (
        <CompactRow message={message} timeZone={timeZone} />
      ) : (
        <FullRow message={message} timeZone={timeZone} />
      )}
    </li>
  );
}

type RowProps = { message: Message; timeZone: string };

function CompactRow({ message, timeZone }: RowProps) {
  return (
    <div className="group flex gap-2 px-5 py-1">
      <div className="flex w-9 shrink-0 justify-end pt-1">
        <time
          dateTime={message.createdAt}
          className="text-caption text-fg-muted opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
        >
          {formatTime(message.createdAt, timeZone)}
        </time>
      </div>
      <div className="min-w-0 flex-1">
        <MessageBody text={message.body} />
      </div>
    </div>
  );
}

function FullRow({ message, timeZone }: RowProps) {
  return (
    <div className="mt-2 flex gap-2 px-5 py-1">
      <div className="flex w-9 shrink-0 justify-end">
        <Avatar initials={message.author.initials} seed={message.author.id} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="flex items-baseline gap-2">
          <span className="text-body font-black text-fg">{message.author.name}</span>
          <time dateTime={message.createdAt} className="text-caption text-fg-muted">
            {formatTime(message.createdAt, timeZone)}
          </time>
        </p>
        <MessageBody text={message.body} />
      </div>
    </div>
  );
}
