"use client";

import { MessageSquare } from "lucide-react";
import { startTransition, useActionState, useEffect, useRef } from "react";
import { login, type LoginState } from "@/app/actions/login";
import { Button } from "@/app/components/ui/button";
import { Field } from "@/app/components/ui/field";
import { Input } from "@/app/components/ui/input";

const INVALID_CREDENTIALS =
  "E-mail ou senha incorretos. Confira os dados e tente de novo.";

const INITIAL_STATE: LoginState = { status: "idle" };

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(login, INITIAL_STATE);
  const passwordRef = useRef<HTMLInputElement>(null);

  // Credenciais incorretas: a senha é limpa e recebe o foco; o e-mail continua.
  useEffect(() => {
    if (state.status === "invalid_credentials") {
      const input = passwordRef.current;
      if (input) {
        input.value = "";
        input.focus();
      }
    }
  }, [state]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending) return;
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  }

  const passwordError =
    state.status === "invalid_credentials" ? INVALID_CREDENTIALS : undefined;

  return (
    <div className="flex w-full max-w-md flex-col gap-6 rounded-panel bg-surface-raised p-8 shadow-2">
      <div className="flex w-full flex-col items-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-card bg-sidebar text-sidebar-fg-strong">
          <MessageSquare size={24} aria-hidden />
        </div>
        <div className="flex w-full flex-col gap-1 text-center">
          <h1 className="text-display font-black text-fg">Entrar no Full Cycle</h1>
          <p className="text-body text-fg-muted">
            Use o e-mail da sua conta de trabalho.
          </p>
        </div>
      </div>

      {/* O action vale antes da hidratação (o React o renderiza como POST para o Server Action):
          sem ele, o navegador mandaria um GET com a senha na URL. Com o JS, o onSubmit chama o
          mesmo Server Action. */}
      <form
        className="flex w-full flex-col gap-4"
        action={formAction}
        onSubmit={handleSubmit}
        noValidate
      >
        <Field label="E-mail" htmlFor="email">
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            autoFocus
          />
        </Field>
        <Field
          label="Senha"
          htmlFor="password"
          error={passwordError}
          errorId="password-error"
        >
          <Input
            ref={passwordRef}
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            aria-invalid={passwordError ? true : undefined}
            aria-describedby={passwordError ? "password-error" : undefined}
          />
        </Field>
        <Button type="submit" size="lg" className="w-full" loading={isPending}>
          Entrar
        </Button>
      </form>
    </div>
  );
}
