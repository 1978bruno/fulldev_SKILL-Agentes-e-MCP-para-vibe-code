// Divisor de dia (DayDivider): uma linha com o rótulo no centro. Fica no começo do item da
// primeira Mensagem do dia, para a lista de Mensagens continuar só com itens de Mensagem.
export function DayDivider({ label }: { label: string }) {
  return (
    <div className="relative flex items-center justify-center py-3">
      <span aria-hidden className="absolute inset-x-0 top-1/2 h-px bg-border-subtle" />
      <span className="relative rounded-pill border border-border bg-surface px-3 py-0.5 text-small font-bold text-fg">
        {label}
      </span>
    </div>
  );
}
