# Plano de testes da F03 · Tempo real

Escrito pelo fluxo da skill `playwright-cli` (planejar, gerar e corrigir), no contêiner `e2e`.
O que é coberto é da spec da F03 ([spec.md](../../../docs/funcionalidades/03-tempo-real/spec.md),
"Decisões de teste"); este plano é dono dos passos de cada cenário.

## Visão geral

O navegador do contêiner `e2e` abre a web e a API do chat por `localhost`, pelo encaminhador de
portas do serviço, e o cookie de sessão vale para o WebSocket (LLD, "Ambiente de desenvolvimento").
O provedor do tempo real marca o estado da conexão em `data-realtime`, e os testes esperam
`connected` antes de agir. Os testes com duas Pessoas usam as fixtures `otherPerson`,
`sharedChannel` e `otherPage`, esta última num contexto próprio do navegador.

## Cenários

### 1. Conexão em tempo real

**Seed:** `e2e/seed.spec.ts`

#### 1.1. mantém um socket conectado ao trocar de Canal

**File:** `e2e/tempo-real/conexao-por-aba.spec.ts`

**Steps:**
  1. Com dois Canais, entrar e cair no primeiro
    - expect: `data-realtime` fica `connected`
  2. Trocar para o segundo Canal pela barra lateral
    - expect: continua `connected`, com um WebSocket aberto só

#### 1.2. conecta as abas de duas Pessoas no mesmo Canal

**File:** `e2e/tempo-real/conexao-por-aba.spec.ts`

**Steps:**
  1. Cada Pessoa, no próprio contexto, abre o Canal em comum
    - expect: as duas abas ficam `connected`

### 2. Sessão no WebSocket

#### 2.1. vai para Entrar quando o handshake recusa a Sessão

**File:** `e2e/tempo-real/sessao-revogada-no-handshake.spec.ts`

**Steps:**
  1. Logada, com o WebSocket encaminhado ao servidor pelo `routeWebSocket`, abrir o Canal
    - expect: `connected`
  2. Revogar as Sessões da Pessoa no banco e fechar a conexão pela rota
    - expect: a reconexão recebe `unauthenticated` e a aba vai para "Entrar", com o `?para=` do Canal

### 3. Mensagens chegando sem recarregar

#### 3.1. a Mensagem da outra Pessoa aparece sem recarregar

**File:** `e2e/tempo-real/mensagem-chega-sem-recarregar.spec.ts`

**Steps:**
  1. As duas Pessoas abrem o Canal em comum e esperam `connected`
  2. A outra Pessoa envia uma Mensagem
    - expect: a Mensagem aparece uma vez para a primeira, com o nome da autora

#### 3.2. a Mensagem enviada por outra aba aparece uma vez só

**File:** `e2e/tempo-real/mensagem-chega-sem-recarregar.spec.ts`

**Steps:**
  1. A mesma Pessoa abre o Canal em duas abas do mesmo contexto
  2. Envia pela segunda aba
    - expect: a Mensagem aparece uma vez em cada aba, sem ficar "enviando"

#### 3.3. o reset traz a Mensagem gravada antes da conexão e mantém o texto da caixa

**File:** `e2e/tempo-real/reset-recarrega-a-mais-recente.spec.ts`

**Steps:**
  1. Entrar com o WebSocket encaminhado pelo `routeWebSocket`; depois disso, a próxima conexão fica
     segurada
  2. Abrir o Canal e escrever na caixa, sem enviar
  3. A outra Pessoa envia uma Mensagem
  4. Soltar a conexão
    - expect: o `sync` com `reset` recarrega a página mais recente e a Mensagem aparece
    - expect: o texto da caixa continua lá

#### 3.4. a Mensagem que chegou em outro Canal aparece ao abri-lo

**File:** `e2e/tempo-real/mensagem-de-outra-conversa.spec.ts`

**Steps:**
  1. A Pessoa fica no Canal em comum; a outra abre um segundo Canal das duas e envia nele
  2. A Pessoa abre o segundo Canal pela barra lateral
    - expect: a Mensagem aparece uma vez
