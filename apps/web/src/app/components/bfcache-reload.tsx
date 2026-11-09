"use client";

import { useEffect } from "react";

// Uma tela logada restaurada do bfcache (voltar pelo histórico depois de sair) recarrega, para
// passar de novo pela verificação da Sessão (LLD, "Cliente", "Histórico depois de sair").
export function BfcacheReload() {
  useEffect(() => {
    function handlePageShow(event: PageTransitionEvent) {
      if (event.persisted) window.location.reload();
    }
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);
  return null;
}
