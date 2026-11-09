"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useTransition } from "react";
import { Button, type ButtonProps } from "./button";

type RetryButtonProps = ButtonProps & {
  // Texto da falha anunciado ao leitor de tela, ao montar e a cada tentativa que termina na mesma
  // falha.
  announce?: string;
};

// "Tentar de novo" que renderiza a rota de novo, em carga até a nova renderização chegar, sem
// aceitar outro clique nesse meio-tempo.
export function RetryButton({ announce, children = "Tentar de novo", ...props }: RetryButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const liveRef = useRef<HTMLParagraphElement>(null);

  // O texto vem do servidor já pronto, e um leitor de tela não anuncia conteúdo que estava lá na
  // carga. A região live é preenchida no cliente, depois de montar e a cada tentativa que termina
  // de novo nesta tela; depois do anúncio ela esvazia, para o texto não ser lido de novo.
  useEffect(() => {
    const region = liveRef.current;
    if (!region || !announce || isPending) return;
    region.textContent = "";
    const frame = requestAnimationFrame(() => {
      region.textContent = announce;
    });
    const clear = setTimeout(() => {
      region.textContent = "";
    }, 3000);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(clear);
    };
  }, [announce, isPending]);

  return (
    <>
      <Button
        {...props}
        loading={isPending}
        onClick={() => startTransition(() => router.refresh())}
      >
        {children}
      </Button>
      {announce && <p ref={liveRef} role="alert" className="sr-only" />}
    </>
  );
}
