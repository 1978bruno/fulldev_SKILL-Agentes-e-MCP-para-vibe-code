"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { TIME_ZONE_COOKIE } from "@/app/utils/time-zone";

// Validade dos cookies do cliente: a do cookie de sessão, 400 dias (LLD, "Cookies do cliente").
const MAX_AGE_SECONDS = 400 * 24 * 60 * 60;

// Grava o fuso do navegador no cookie que o servidor usa para as horas e os dias. Se o gravado
// era outro, renderiza a rota de novo, já no fuso certo.
export function TimeZoneSync({ serverTimeZone }: { serverTimeZone: string }) {
  const router = useRouter();
  useEffect(() => {
    const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!browserTimeZone || browserTimeZone === serverTimeZone) return;
    document.cookie = `${TIME_ZONE_COOKIE}=${encodeURIComponent(browserTimeZone)}; Path=/; Max-Age=${MAX_AGE_SECONDS}; SameSite=Lax`;
    router.refresh();
  }, [serverTimeZone, router]);
  return null;
}
