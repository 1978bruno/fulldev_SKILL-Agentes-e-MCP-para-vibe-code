"use client";

import { useEffect, useState } from "react";
import { useRealtime } from "@/app/components/realtime/realtime-provider";

// Quanto tempo sem conexão até a faixa aparecer (LLD, "Valores e configuração"): uma queda curta
// não pisca na tela.
export const CONNECTION_BANNER_DELAY_MS = 3_000;

// Se a faixa de conexão aparece: depois do atraso sem conexão, contado da última mudança do estado,
// inclusive a primeira conexão que demora; some assim que conecta.
export function useConnectionBanner(): boolean {
  const { status, statusSince } = useRealtime();
  const [checkedAt, setCheckedAt] = useState(0);

  useEffect(() => {
    if (status === "connected") return;
    const wait = Math.max(0, statusSince + CONNECTION_BANNER_DELAY_MS - Date.now());
    const timer = setTimeout(() => setCheckedAt(Date.now()), wait);
    return () => clearTimeout(timer);
  }, [status, statusSince]);

  return status !== "connected" && checkedAt - statusSince >= CONNECTION_BANNER_DELAY_MS;
}
