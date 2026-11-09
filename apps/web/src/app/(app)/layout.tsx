import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { BfcacheReload } from "@/app/components/bfcache-reload";
import { Spinner } from "@/app/components/ui/spinner";
import { Rail } from "@/app/components/workspace-nav/rail";
import { Sidebar } from "@/app/components/workspace-nav/sidebar";
import { getCurrentPerson } from "@/app/services/chat-api";
import { readSessionToken } from "@/app/services/session-cookie";
import {
  expiredSessionPath,
  REQUESTED_PATH_HEADER,
} from "@/app/utils/return-path";

// Layout das telas logadas: verifica a Sessão na API do chat a cada renderização
// (LLD, "Cliente", "Sessão no cliente").
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <Suspense fallback={<AppLoading />}>
      <AuthenticatedShell>{children}</AuthenticatedShell>
    </Suspense>
  );
}

async function AuthenticatedShell({ children }: { children: React.ReactNode }) {
  const token = await readSessionToken();
  const result = token ? await getCurrentPerson(token) : null;
  if (result?.kind !== "ok") {
    // Um Server Component não apaga cookie: a rota do BFF apaga e leva a "Entrar".
    const requestedPath = (await headers()).get(REQUESTED_PATH_HEADER);
    redirect(expiredSessionPath(requestedPath));
  }

  return (
    <div className="flex h-screen">
      <BfcacheReload />
      <Rail person={result.person} />
      <Sidebar />
      <main className="flex min-w-0 flex-1 flex-col bg-surface">{children}</main>
    </div>
  );
}

function AppLoading() {
  return (
    <div className="flex h-screen items-center justify-center bg-surface text-fg-muted">
      <Spinner size="md" />
    </div>
  );
}
