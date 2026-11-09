import { Avatar } from "@/app/components/ui/avatar";
import { cn } from "@/app/utils/cn";
import type { Message } from "@/app/services/chat-api";
import { formatTime } from "@/app/utils/format-time";
import { DayDivider } from "./day-divider";
import { MessageBody } from "./message-body";

type MessageItemProps = {
  message: Message;
  timeZone: string;
  // Forma compacta (22:7404): sem avatar nem nome, com a hora na calha ao passar o mouse ou com o
  // foco do teclado na área do histórico.
  compact?: boolean;
  // Rótulo do divisor de dia, na primeira Mensagem de cada dia.
  dayLabel?: string;
};

// Mensagem (MessageItem), no layout completo ou compacto. Os estados "enviando" e "falhou" e a
// barra de ações entram na F02-T05 e na F06.
export function MessageItem({ message, timeZone, compact = false, dayLabel }: MessageItemProps) {
  return (
    <li data-message-id={message.id} data-layout={compact ? "compact" : "full"} className="flex flex-col">
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
      {/* Sem o nome à vista, como no Figma; o leitor de tela ainda ouve de quem é. */}
      <span className="sr-only">{message.author.name}</span>
      <div className="flex w-9 shrink-0 justify-end pt-1">
        <MessageTime
          message={message}
          timeZone={timeZone}
          className="opacity-0 group-hover:opacity-100 group-focus-visible/history:opacity-100"
        />
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
          <MessageTime message={message} timeZone={timeZone} />
        </p>
        <MessageBody text={message.body} />
      </div>
    </div>
  );
}

function MessageTime({ message, timeZone, className }: RowProps & { className?: string }) {
  return (
    <time dateTime={message.createdAt} className={cn("text-caption text-fg-muted", className)}>
      {formatTime(message.createdAt, timeZone)}
    </time>
  );
}
