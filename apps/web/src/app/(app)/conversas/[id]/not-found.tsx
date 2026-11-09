import Link from "next/link";
import { buttonVariants } from "@/app/components/ui/button";
import { EmptyState } from "@/app/components/ui/empty-state";
import { HeaderlessScreen } from "@/app/components/workspace-nav/headerless-screen";

// "Conversa / Estrutura / Conversa não encontrada": a mesma tela para a Conversa que não existe e
// para a de que a Pessoa não participa.
export default function ConversationNotFound() {
  return (
    <HeaderlessScreen className="items-center justify-center">
      <EmptyState
        titleAs="h1"
        title="Conversa não encontrada"
        description="Ela não existe ou você não participa dela."
        action={
          <Link href="/" className={buttonVariants({ variant: "link" })}>
            Voltar ao início
          </Link>
        }
      />
    </HeaderlessScreen>
  );
}
