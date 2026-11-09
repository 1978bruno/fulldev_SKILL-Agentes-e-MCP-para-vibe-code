import Link from "next/link";
import { EmptyState } from "@/app/components/ui/empty-state";

// "Conversa / Estrutura / Conversa não encontrada": a mesma tela para a Conversa que não existe e
// para a de que a Pessoa não participa.
export default function ConversationNotFound() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <EmptyState
        titleAs="h1"
        title="Conversa não encontrada"
        description="Ela não existe ou você não participa dela."
        action={
          <Link href="/" className="text-body text-link hover:text-link-hover hover:underline">
            Voltar ao início
          </Link>
        }
      />
    </div>
  );
}
