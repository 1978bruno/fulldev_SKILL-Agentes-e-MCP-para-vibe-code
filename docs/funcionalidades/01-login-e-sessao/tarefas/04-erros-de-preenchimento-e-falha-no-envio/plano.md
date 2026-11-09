# Plano da F01-T04: Erros de preenchimento e falha no envio ao entrar

Tarefa: [tarefa.md](tarefa.md) · Spec: [spec.md](../../spec.md) · PRD: [prd.md](../../prd.md)

## Critérios

### CA1

**Marca:** teste no Playwright

**Cenário 1:** Dado a tela Entrar, quando a Pessoa envia com o E-mail vazio e a Senha vazia, então
vê "Informe um e-mail válido, como nome@empresa.com." abaixo do E-mail e "Informe sua senha."
abaixo da Senha, e nenhum envio sai para o servidor.

**Cenário 2:** Dado a tela Entrar, quando a Pessoa envia com um E-mail fora do formato e uma senha,
então vê só a mensagem do E-mail, e nenhum envio sai.

A mesma validação no Server Action é conferida por quem revisa: o formulário e o Server Action
chamam a mesma função, `validateLogin`, de `src/app/utils/login-validation.ts`.

**Teste previsto:** Playwright, `e2e/login/erros-de-preenchimento.spec.ts`, com a contagem dos
`POST` para `/entrar` pelo `page.on('request')`.

### CA2

**Marca:** teste no Playwright

**Cenário:** Dado a tela Entrar, quando a Pessoa envia com a Senha vazia e o E-mail válido, então o
foco vai para a Senha; quando envia com os dois vazios, o foco vai para o E-mail. O campo com erro
tem `aria-invalid="true"` e `aria-describedby` com o id da mensagem dele.

**Teste previsto:** Playwright, `e2e/login/erros-de-preenchimento.spec.ts` (mesmo arquivo do CA1,
no cenário do foco).

### CA3

**Marca:** revisão humana

**Cenário:** Dado a API do chat parada, quando a Pessoa envia um e-mail e uma senha, então vê "Não
foi possível entrar agora. Confira sua conexão e tente de novo." num elemento com
`role="alert"` entre a Senha e o botão, o E-mail e a Senha continuam preenchidos, e o foco fica
onde estava (no botão, depois do clique). O registro `falha-no-envio.md`, com o snapshot e a
captura do `playwright-cli`, fica na pasta desta tarefa. O 5xx e o tempo esgotado caem no mesmo
caminho no service HTTP (`kind: "failure"`), conferido no código.

### CA4

**Marca:** revisão humana

**Cenário:** Dado o arquivo do Figma, seção Login, quando quem revisa procura "Login / Falha no
envio", então encontra o frame feito de instâncias dos componentes locais (Field, Input, Button) e
com cores das variables locais, criado antes do código da mensagem; e a validação visual mostra a
tela igual a ele.

### CA5

**Marca:** teste no Playwright

**Cenário:** Dado a tela Entrar, com o foco inicial no E-mail, quando a Pessoa digita o e-mail,
aperta Tab, digita a senha, aperta Tab e confere que o foco está no botão "Entrar", volta com
Shift+Tab para a Senha e aperta Enter, então entra e chega à Home.

**Teste previsto:** Playwright, `e2e/login/entrar-pelo-teclado.spec.ts`.

### CA6

**Marca:** teste no Playwright

**Cenário:** Dado as telas Entrar (com e sem erro de validação) e Home, quando o axe analisa a
página, então não há violações.

**Teste previsto:** Playwright, `e2e/acessibilidade/entrar-e-home-sem-violacoes.spec.ts`, com
`AxeBuilder` do `@axe-core/playwright`. O CA1, o CA2 e o CA5 estão nos testes acima; o CA3 no
registro do `playwright-cli`.

### CA7

**Marca:** documento

**Cenário:** Dado a pasta desta tarefa, quando quem revisa abre `roteiro-manual.md`, então encontra
os passos para medir a Acessibilidade da tela Entrar no Lighthouse e o campo do resultado,
preenchido pela pessoa que mediu; e `validacao-visual.md` com "Erro de validação" e "Falha no
envio" nos dois temas, ao lado do Figma.

## Contrato

O contrato não muda.

## Verificação do contrato

Nenhum item.

## Decisões

- **Validação única:** `validateLogin({ email, password })`, uma função pura em
  `src/app/utils/login-validation.ts`, que devolve as mensagens por campo. O e-mail é aceito
  depois de tirar os espaços das pontas, com a forma `algo@algo.algo` e até 254 caracteres, para
  não aceitar no cliente o que a API recusa. O formulário a chama antes de enviar; o Server Action
  a chama de novo e, com erro, devolve `invalid_input` com as mensagens, sem chamar a API.
- **Validação só no envio:** as mensagens aparecem ao enviar e somem no próximo envio que passar
  na validação; não há validação ao digitar, que o PRD não pede.
- **Mensagem do formulário:** um `<p role="alert">` entre a Senha e o botão, mostrado nos estados
  `failure` (e, na T08, `too_many_attempts`). É o padrão que a T08 reaproveita.
- **Falha no envio:** o service HTTP já devolve `failure` para rede fora, tempo esgotado (5 s) e
  qualquer status fora de 201 e 401 `invalid_credentials`; o Server Action devolve `failure`, e o
  formulário não mexe nos campos nem no foco.
- **Figma antes do código:** "Login / Falha no envio" (nó 86:22) nasce de uma cópia de "Login /
  Enviando", que já tem os campos preenchidos, com o botão trocado pela instância do "Padrão" e a
  mensagem em `status/danger-fg` e `small/regular` entre a Senha e o botão, à direita dos frames
  da seção Login. O "Login / Tentativas demais" da T08 (nó 86:54) foi criado junto, do mesmo jeito.
- **Lighthouse:** a medição é de uma pessoa, pelo Chrome DevTools (spec, "Roteiro manual"). O
  agente escreve o roteiro e deixa o resultado para quem mede.

## Arquivos e interfaces

- `apps/web/src/app/utils/login-validation.ts`: `validateLogin`, `LoginFieldErrors`, as mensagens.
- `apps/web/src/app/actions/login.ts`: `LoginState` ganha `fieldErrors` em `invalid_input`.
- `apps/web/src/app/components/auth/login-form.tsx`: validação no envio, foco, mensagens de campo e
  do formulário.
- `apps/web/e2e/login/erros-de-preenchimento.spec.ts`, `e2e/login/entrar-pelo-teclado.spec.ts`,
  `e2e/acessibilidade/entrar-e-home-sem-violacoes.spec.ts`; `e2e/plano-de-testes-f01.md`.

## Testes existentes que mudam

Nenhum.

## Mudança de dados

Nenhuma.

## Documentos atualizados

Nenhum. As mensagens e os estados já estão no PRD (história 2) e na spec ("BFF e telas").
