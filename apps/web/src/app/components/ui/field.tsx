import { cn } from "@/app/utils/cn";

type FieldProps = {
  label: string;
  htmlFor: string;
  // "(opcional)" ao lado do rótulo, em fg-muted.
  optional?: boolean;
  hint?: string;
  hintId?: string;
  error?: string;
  errorId?: string;
  className?: string;
  children: React.ReactNode;
};

// Rótulo + controle + dica ou erro: o erro toma o lugar da dica. O controle recebe aria-invalid e
// aria-describedby com o id do que estiver visível.
export function Field({
  label,
  htmlFor,
  optional,
  hint,
  hintId,
  error,
  errorId,
  className,
  children,
}: FieldProps) {
  return (
    <div className={cn("flex w-full flex-col gap-1", className)}>
      <label htmlFor={htmlFor} className="text-body font-bold text-fg">
        {label}
        {optional && <span className="font-normal text-fg-muted"> (opcional)</span>}
      </label>
      {children}
      {error ? (
        <p id={errorId} className="text-small text-danger-fg">
          {error}
        </p>
      ) : (
        hint && (
          <p id={hintId} className="text-small text-fg-muted">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
