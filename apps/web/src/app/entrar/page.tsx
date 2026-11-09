import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LoginForm } from "@/app/components/auth/login-form";
import { getCurrentPerson } from "@/app/services/chat-api";
import { readSessionToken } from "@/app/services/session-cookie";
import {
  expiredSessionPath,
  isVerificationFailed,
  safeReturnPath,
  VERIFICATION_FAILED_PARAM,
} from "@/app/utils/return-path";

export const metadata: Metadata = { title: "Entrar · Full Cycle Chat" };

export default function LoginPage({ searchParams }: PageProps<"/entrar">) {
  return (
    <main className="flex flex-1 items-center justify-center bg-surface-subtle p-4">
      <Suspense>
        <LoginGate searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

// "Entrar" aberta com cookie verifica a Sessão: com 200 vai para a Home; com 401 a rota do BFF
// apaga o cookie e volta para cá; com falha de rede ou 5xx, mostra o formulário. Vinda de uma
// verificação que acabou de falhar, mostra o formulário sem verificar de novo.
async function LoginGate({
  searchParams,
}: {
  searchParams: PageProps<"/entrar">["searchParams"];
}) {
  const { para, [VERIFICATION_FAILED_PARAM]: verification } = await searchParams;
  const returnPath = safeReturnPath(para);
  const token = await readSessionToken();
  if (token && !isVerificationFailed(verification)) {
    const result = await getCurrentPerson(token);
    if (result.kind === "ok") redirect("/");
    if (result.kind === "unauthenticated") redirect(expiredSessionPath(returnPath));
  }
  return <LoginForm returnPath={returnPath} />;
}
