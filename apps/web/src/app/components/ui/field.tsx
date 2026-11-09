import { cn } from "@/app/utils/cn";

type FieldProps = {
  label: string;
  htmlFor: string;
  error?: string;
  errorId?: string;
  className?: string;
  children: React.ReactNode;
};

// Rótulo + controle + erro. O controle recebe aria-invalid e aria-describedby={errorId}.
export function Field({
  label,
  htmlFor,
  error,
  errorId,
  className,
  children,
}: FieldProps) {
  return (
    <div className={cn("flex w-full flex-col gap-1", className)}>
      <label htmlFor={htmlFor} className="text-body font-bold text-fg">
        {label}
      </label>
      {children}
      {error && (
        <p id={errorId} className="text-small text-danger-fg">
          {error}
        </p>
      )}
    </div>
  );
}
