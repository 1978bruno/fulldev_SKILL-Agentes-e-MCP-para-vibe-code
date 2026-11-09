"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button, type ButtonProps } from "./button";

// "Tentar de novo" que renderiza a rota de novo, em carga até a nova renderização chegar, sem
// aceitar outro clique nesse meio-tempo.
export function RetryButton({ children = "Tentar de novo", ...props }: ButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  return (
    <Button
      {...props}
      loading={isPending}
      onClick={() => startTransition(() => router.refresh())}
    >
      {children}
    </Button>
  );
}
