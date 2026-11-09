import { LoaderCircle } from "lucide-react";
import { cn } from "@/app/utils/cn";

const SIZES = { sm: 16, md: 20, lg: 24 } as const;

type SpinnerProps = { size?: keyof typeof SIZES; className?: string };

export function Spinner({ size = "sm", className }: SpinnerProps) {
  return (
    <LoaderCircle
      size={SIZES[size]}
      aria-hidden
      className={cn("animate-spin", className)}
    />
  );
}
