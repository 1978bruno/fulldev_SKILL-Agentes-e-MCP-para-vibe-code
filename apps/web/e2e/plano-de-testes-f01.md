# Plano de testes da F01 · Login e sessão

Escrito pelo fluxo da skill `playwright-cli` (planejar, gerar e corrigir), no contêiner `e2e`.
O que é coberto é da spec da F01 ([spec.md](../../../docs/funcionalidades/01-login-e-sessao/spec.md),
"Decisões de teste"); este plano é dono dos passos de cada cenário.

## Visão geral

A Pessoa entra com e-mail e senha da conta que a empresa criou, cai na Home, continua logada
enquanto a Sessão vale e sai pelo menu do avatar. Os testes rodam só no Chromium, contra o
ambiente de desenvolvimento de pé (web, API do chat e banco `chat`). Cada teste cria a própria
Pessoa pela fixture `person`; os que partem de alguém logado usam `loggedInPage`.

## Cenários

### 1. Entrar

**Seed:** `e2e/seed.spec.ts`

#### 1.1. entrar-ate-a-home

**File:** `e2e/login/entrar-ate-a-home.spec.ts`

**Steps:**
  1. Abrir `/entrar`
    - expect: o foco está no campo E-mail
  2. Preencher E-mail e Senha da Pessoa e clicar em "Entrar"
    - expect: a URL é `/`
    - expect: a navegação "Seções" tem o "FC", o link "Início" ativo e o avatar com o nome da Pessoa e as iniciais dela
    - expect: a barra lateral tem o cabeçalho "Full Cycle"
    - expect: o título "Nenhuma conversa ainda" aparece
  3. Abrir `/` em outra página do mesmo navegador
    - expect: a URL continua `/`, já logada

#### 1.2. credenciais-incorretas

**File:** `e2e/login/credenciais-incorretas.spec.ts`

**Steps:**
  1. Abrir `/entrar`, preencher o E-mail da Pessoa e uma senha errada
  2. Clicar em "Entrar", com o envio atrasado de propósito
    - expect: durante o envio, o botão "Entrar" fica desabilitado e ocupado
    - expect: a mensagem "E-mail ou senha incorretos. Confira os dados e tente de novo." aparece abaixo da Senha
    - expect: a Senha fica vazia, inválida e com o foco
    - expect: o E-mail continua preenchido

### 2. Sem Sessão

**Seed:** `e2e/seed.spec.ts`

#### 2.1. redireciona-sem-sessao

**File:** `e2e/login/redireciona-sem-sessao.spec.ts`

**Steps:**
  1. Sem cookie, abrir `/`
    - expect: a URL é `/entrar`

#### 2.2. sessao-desconhecida-volta-para-entrar

**File:** `e2e/login/sessao-desconhecida-volta-para-entrar.spec.ts`

**Steps:**
  1. Com um cookie de sessão cujo token a API não conhece, abrir `/`
    - expect: a URL é `/entrar`
    - expect: o cookie de sessão deixa de existir
