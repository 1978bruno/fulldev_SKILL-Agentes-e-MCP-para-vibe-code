import { cva, type VariantProps } from "class-variance-authority";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/app/utils/cn";
import { Spinner } from "./spinner";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-control font-bold transition-colors duration-100 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-on-primary hover:bg-primary-hover active:bg-primary-active",
        secondary:
          "border border-border-strong bg-surface text-fg hover:bg-surface-subtle",
        ghost: "text-fg hover:bg-surface-subtle",
        danger: "bg-danger text-on-primary hover:bg-danger-hover",
        link: "h-auto p-0 font-normal text-link hover:text-link-hover hover:underline",
      },
      size: {
        sm: "h-7 px-3 text-small",
        md: "h-9 px-4 text-body",
        lg: "h-11 px-5 text-body",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    icon?: LucideIcon;
    loading?: boolean;
  };

export function Button({
  variant,
  size,
  icon: Icon,
  loading,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Spinner size="sm" /> : Icon && <Icon size={16} aria-hidden />}
      {children}
    </button>
  );
}
