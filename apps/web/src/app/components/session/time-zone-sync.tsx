"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { COOKIE_MAX_AGE_SECONDS } from "@/app/utils/client-cookies";
import { DEFAULT_TIME_ZONE } from "@/app/utils/format-time";
import { TIME_ZONE_COOKIE } from "@/app/utils/time-zone";

// Grava o fuso do navegador no cookie que o servidor usa para as horas e os dias, e renderiza a
// rota de novo, já no fuso certo. Compara com o próprio cookie, e não com o fuso que o servidor
// aceitou: um fuso que o servidor não reconhece fica gravado e não renderiza de novo a cada carga.
export function TimeZoneSync() {
  const router = useRouter();
  useEffect(() => {
    const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const saved = readCookie(TIME_ZONE_COOKIE);
    if (!browserTimeZone || saved === browserTimeZone) return;
    document.cookie = `${TIME_ZONE_COOKIE}=${encodeURIComponent(browserTimeZone)}; Path=/; Max-Age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
    // Sem cookie, o servidor já usou o fuso padrão: se é o do navegador, não há o que renderizar.
    const renderedIn = saved ?? DEFAULT_TIME_ZONE;
    if (renderedIn !== browserTimeZone && readCookie(TIME_ZONE_COOKIE) === browserTimeZone) {
      router.refresh();
    }
  }, [router]);
  return null;
}

function readCookie(name: string): string | undefined {
  const entry = document.cookie.split("; ").find((cookie) => cookie.startsWith(`${name}=`));
  if (!entry) return undefined;
  try {
    return decodeURIComponent(entry.slice(name.length + 1));
  } catch {
    // Valor corrompido: tratado como ausente, para o fuso do navegador ser gravado por cima.
    return undefined;
  }
}
