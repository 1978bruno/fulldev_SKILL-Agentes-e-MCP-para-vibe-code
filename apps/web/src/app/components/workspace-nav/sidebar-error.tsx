import { RetryButton } from "@/app/components/ui/retry-button";

// "Barra lateral / Erro" (25:19177): a lista de Conversas não carregou; o resto do shell segue de
// pé, e "Tentar de novo" renderiza a rota de novo.
const MESSAGE = "Não foi possível carregar suas conversas.";

export function SidebarError() {
  return (
    <div className="flex flex-col items-start gap-2 px-4">
      <p className="text-small text-sidebar-fg">{MESSAGE}</p>
      <RetryButton variant="secondary" size="sm" announce={MESSAGE} />
    </div>
  );
}
