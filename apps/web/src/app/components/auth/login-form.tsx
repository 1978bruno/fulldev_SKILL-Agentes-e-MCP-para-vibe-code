"use client";

import { MessageSquare } from "lucide-react";
import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
} from "react";
import { login, type LoginState } from "@/app/actions/login";
import { Button } from "@/app/components/ui/button";
import { Field } from "@/app/components/ui/field";
import { Input } from "@/app/components/ui/input";
import {
  hasErrors,
  validateLogin,
  type LoginFieldErrors,
} from "@/app/utils/login-validation";

const INVALID_CREDENTIALS =
  "E-mail ou senha incorretos. Confira os dados e tente de novo.";

// Mensagens do formulário: ficam entre a Senha e o botão, com role="alert".
const FORM_MESSAGES: Partial<Record<LoginState["status"], string>> = {
  failure: "Não foi possível entrar agora. Confira sua conexão e tente de novo.",
  too_many_attempts:
    "Muitas tentativas de entrar. Aguarde alguns minutos e tente de novo.",
};

const INITIAL_STATE: LoginState = { status: "idle" };

// A rede pode cair na própria chamada do Server Action, antes de ele devolver um estado: o fetch
// rejeita com TypeError. Isso vira a mesma falha recuperável; o resto (como o redirecionamento
// do login certo) segue para o Next.
async function loginOrFailure(
  previous: LoginState,
  formData: FormData,
): Promise<LoginState> {
  try {
    return await login(previous, formData);
  } catch (error) {
    if (error instanceof TypeError) return { status: "failure" };
    throw error;
  }
}

function focusIsLost(): boolean {
  return !document.activeElement || document.activeElement === document.body;
}

type LoginFormProps = {
  // Caminho pedido antes de "Entrar", já conferido; o Server Action confere de novo.
  returnPath: string;
};

export function LoginForm({ returnPath }: LoginFormProps) {
  const [state, formAction, isPending] = useActionState(
    loginOrFailure,
    INITIAL_STATE,
  );
  // Erros da validação no cliente; os do Server Action chegam pelo state.
  const [clientErrors, setClientErrors] = useState<LoginFieldErrors>({});
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  // Onde estava o foco ao enviar: o botão desabilitado durante o envio o perde.
  const focusedOnSubmitRef = useRef<HTMLElement | null>(null);
  // O foco vai para o primeiro campo inválido depois que os erros aparecem, para o leitor de
  // tela já encontrar a descrição ao chegar no campo.
  const shouldFocusInvalidRef = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Marca o formulário como hidratado: antes disso, o envio é o do navegador, sem a validação
  // no cliente. Os testes de ponta a ponta esperam a marca antes de interagir.
  useEffect(() => {
    formRef.current?.setAttribute("data-ready", "");
  }, []);

  // Credenciais incorretas: a senha é limpa e recebe o foco; o e-mail continua.
  useEffect(() => {
    if (state.status === "invalid_credentials") {
      const input = passwordRef.current;
      if (input) {
        input.value = "";
        input.focus();
      }
    }
    // Mensagem do formulário (falha no envio, tentativas demais): o foco volta para onde estava,
    // só se ele se perdeu (a Pessoa pode ter ido para outro campo enquanto esperava).
    if (
      (state.status === "failure" || state.status === "too_many_attempts") &&
      focusIsLost()
    ) {
      focusedOnSubmitRef.current?.focus();
    }
  }, [state]);

  useEffect(() => {
    if (!shouldFocusInvalidRef.current) return;
    shouldFocusInvalidRef.current = false;
    if (clientErrors.email) emailRef.current?.focus();
    else if (clientErrors.password) passwordRef.current?.focus();
  }, [clientErrors]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending) return;
    const formData = new FormData(event.currentTarget);
    const errors = validateLogin({
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    });
    setClientErrors(errors);
    if (hasErrors(errors)) {
      shouldFocusInvalidRef.current = true;
      return;
    }
    focusedOnSubmitRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    startTransition(() => formAction(formData));
  }

  const serverErrors =
    state.status === "invalid_input" ? state.fieldErrors : {};
  const emailError = clientErrors.email ?? serverErrors.email;
  const passwordError =
    clientErrors.password ??
    serverErrors.password ??
    (state.status === "invalid_credentials" && !hasErrors(clientErrors)
      ? INVALID_CREDENTIALS
      : undefined);
  // A mensagem do envio anterior some enquanto o novo está em andamento.
  const formMessage =
    hasErrors(clientErrors) || isPending ? undefined : FORM_MESSAGES[state.status];

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
          sem ele, o navegador mandaria um GET com a senha na URL. Com o JS, o onSubmit valida e
          chama o mesmo Server Action. */}
      <form
        ref={formRef}
        className="flex w-full flex-col gap-4"
        action={formAction}
        onSubmit={handleSubmit}
        noValidate
      >
        <input type="hidden" name="para" value={returnPath} />
        <Field label="E-mail" htmlFor="email" error={emailError} errorId="email-error">
          <Input
            ref={emailRef}
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            placeholder="nome@empresa.com"
            autoFocus
            aria-invalid={emailError ? true : undefined}
            aria-describedby={emailError ? "email-error" : undefined}
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
        {formMessage && (
          <p role="alert" className="text-small text-danger-fg">
            {formMessage}
          </p>
        )}
        <Button type="submit" size="lg" className="w-full" loading={isPending}>
          Entrar
        </Button>
      </form>
    </div>
  );
}
