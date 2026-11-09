import { Spinner } from "@/app/components/ui/spinner";
import { cn } from "@/app/utils/cn";

// "Portas / Carregando o app": enquanto o layout logado, ou "Entrar", verifica a Sessão.
export function AppLoading({ className }: { className?: string }) {
  return (
    <div
      role="status"
      className={cn(
        "flex h-screen items-center justify-center bg-surface text-fg-muted",
        className,
      )}
    >
      <Spinner size="md" />
      <span className="sr-only">Carregando o Full Cycle</span>
    </div>
  );
}
