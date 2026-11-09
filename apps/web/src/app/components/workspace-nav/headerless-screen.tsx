import { cn } from "@/app/utils/cn";
import { OpenNavigationButton } from "./navigation-drawer";

type HeaderlessScreenProps = {
  children: React.ReactNode;
  // Classes da área do conteúdo, abaixo do topo.
  className?: string;
};

// Tela sem cabeçalho (a Home vazia, o erro da lista, a Conversa não encontrada e o carregamento da
// Home): abaixo de md, um topo com o botão da gaveta, para a navegação seguir ao alcance.
export function HeaderlessScreen({ children, className }: HeaderlessScreenProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-header shrink-0 items-center px-2 md:hidden">
        <OpenNavigationButton />
      </div>
      <div className={cn("flex min-h-0 flex-1", className)}>{children}</div>
    </div>
  );
}
