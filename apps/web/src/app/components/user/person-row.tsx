import { Avatar } from "@/app/components/ui/avatar";
import type { PersonSummary } from "@/app/services/chat-api";

type PersonRowProps = {
  person: PersonSummary;
  // "(você)" ao lado do nome, na lista de Membros.
  isSelf?: boolean;
};

// PersonRow (Figma, Features e widgets): a linha de Pessoa em "Nova conversa", "Adicionar
// pessoas" e "Membros", com o avatar de 36 px e o nome em body/bold.
export function PersonRow({ person, isSelf }: PersonRowProps) {
  return (
    <span className="flex min-w-0 flex-1 items-center gap-3">
      <Avatar initials={person.initials} seed={person.id} />
      <span className="truncate text-body font-bold text-fg">
        {person.name}
        {isSelf && <span className="font-normal text-fg-muted"> (você)</span>}
      </span>
    </span>
  );
}
