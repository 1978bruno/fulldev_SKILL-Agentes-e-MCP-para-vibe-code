import type { LucideIcon } from "lucide-react";

type EmptyStateProps = {
  title: string;
  description: string;
  titleAs?: "h1" | "h2";
  icon?: LucideIcon;
  action?: React.ReactNode;
};

// Ícone num quadro de 48, título, descrição e ação opcional.
export function EmptyState({
  title,
  description,
  titleAs: Title = "h2",
  icon: Icon,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex w-full max-w-md flex-col items-center gap-3 px-6 py-12">
      {Icon && (
        <div className="flex size-12 items-center justify-center rounded-card bg-surface-inset text-fg-muted">
          <Icon size={24} aria-hidden />
        </div>
      )}
      <div className="flex w-full max-w-96 flex-col gap-1 text-center">
        <Title className="text-title font-black text-fg">{title}</Title>
        <p className="text-body text-fg-muted">{description}</p>
      </div>
      {action}
    </div>
  );
}
