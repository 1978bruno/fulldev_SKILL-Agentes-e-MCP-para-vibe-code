import { cn } from "@/app/utils/cn";

// h-9, borda border-strong, placeholder em fg-muted (docs/design-system.md, "Comportamentos
// registrados no Figma"). Foco: borda focus + anel de 4 px focus/30. Inválido (aria-invalid):
// borda danger; com foco, anel danger/25.
export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-9 w-full rounded-control border border-border-strong bg-surface px-3 text-body text-fg placeholder:text-fg-muted",
        "focus-visible:border-focus focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-focus/30",
        "aria-invalid:border-danger aria-invalid:focus-visible:ring-danger/25",
        className,
      )}
      {...props}
    />
  );
}
