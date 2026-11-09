"use client";

import { useEffect, useState } from "react";
import { useRealtime } from "@/app/components/realtime/realtime-provider";

// Quanto tempo sem conexão até a faixa aparecer (LLD, "Valores e configuração"): uma queda curta
// não pisca na tela.
export const CONNECTION_BANNER_DELAY_MS = 3_000;

// Se a faixa de conexão aparece: quando a queda atual, inclusive a primeira conexão que demora, já
// passou do atraso; some assim que conecta. O atraso é contado por queda, e não por mudança de
// estado: ir de "conectando" a "desconectada" não o reinicia.
export function useConnectionBanner(): boolean {
  const { status, outage } = useRealtime();
  const isConnected = status === "connected";
  const [lateOutage, setLateOutage] = useState(0);

  useEffect(() => {
    if (isConnected || outage === 0) return;
    const timer = setTimeout(() => setLateOutage(outage), CONNECTION_BANNER_DELAY_MS);
    return () => clearTimeout(timer);
  }, [isConnected, outage]);

  return !isConnected && outage !== 0 && lateOutage === outage;
}
