import { RetryButton } from "@/app/components/ui/retry-button";

// "Barra lateral / Erro" (25:19177): a lista de Conversas não carregou; o resto do shell segue de
// pé, e "Tentar de novo" renderiza a rota de novo.
export function SidebarError() {
  return (
    <div role="alert" className="flex flex-col items-start gap-2 px-4">
      <p className="text-small text-sidebar-fg">Não foi possível carregar suas conversas.</p>
      <RetryButton variant="secondary" size="sm" />
    </div>
  );
}
