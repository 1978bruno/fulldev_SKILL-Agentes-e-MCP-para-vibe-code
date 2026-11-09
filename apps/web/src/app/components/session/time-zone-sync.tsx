"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { COOKIE_MAX_AGE_SECONDS } from "@/app/utils/client-cookies";
import { TIME_ZONE_COOKIE } from "@/app/utils/time-zone";

// Grava o fuso do navegador no cookie que o servidor usa para as horas e os dias. Se o gravado
// era outro, renderiza a rota de novo, já no fuso certo.
export function TimeZoneSync({ serverTimeZone }: { serverTimeZone: string }) {
  const router = useRouter();
  useEffect(() => {
    const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!browserTimeZone || browserTimeZone === serverTimeZone) return;
    document.cookie = `${TIME_ZONE_COOKIE}=${encodeURIComponent(browserTimeZone)}; Path=/; Max-Age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
    router.refresh();
  }, [serverTimeZone, router]);
  return null;
}
