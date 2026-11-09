import { Spinner } from "@/app/components/ui/spinner";

// "Portas / Carregando o app": enquanto o layout logado verifica a Sessão.
export function AppLoading() {
  return (
    <div
      role="status"
      className="flex h-screen items-center justify-center bg-surface text-fg-muted"
    >
      <Spinner size="md" />
      <span className="sr-only">Carregando o Full Cycle</span>
    </div>
  );
}
