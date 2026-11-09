"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { readClientCookie, writeClientCookie } from "@/app/utils/client-cookies";
import { DEFAULT_TIME_ZONE } from "@/app/utils/format-time";
import { TIME_ZONE_COOKIE } from "@/app/utils/time-zone";

// Grava o fuso do navegador no cookie que o servidor usa para as horas e os dias, e renderiza a
// rota de novo, já no fuso certo. Compara com o próprio cookie, e não com o fuso que o servidor
// aceitou: um fuso que o servidor não reconhece fica gravado e não renderiza de novo a cada carga.
export function TimeZoneSync() {
  const router = useRouter();
  useEffect(() => {
    const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const saved = readClientCookie(TIME_ZONE_COOKIE);
    if (!browserTimeZone || saved === browserTimeZone) return;
    writeClientCookie(TIME_ZONE_COOKIE, browserTimeZone);
    // Sem cookie, o servidor já usou o fuso padrão: se é o do navegador, não há o que renderizar.
    const renderedIn = saved ?? DEFAULT_TIME_ZONE;
    if (renderedIn !== browserTimeZone && readClientCookie(TIME_ZONE_COOKIE) === browserTimeZone) {
      router.refresh();
    }
  }, [router]);
  return null;
}
