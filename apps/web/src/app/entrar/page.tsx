import type { Metadata } from "next";
import { LoginForm } from "@/app/components/auth/login-form";

export const metadata: Metadata = { title: "Entrar · Full Cycle Chat" };

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-surface-subtle p-4">
      <LoginForm />
    </main>
  );
}
