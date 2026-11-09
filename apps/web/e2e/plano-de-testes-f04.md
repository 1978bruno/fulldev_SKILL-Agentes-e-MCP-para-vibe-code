# Plano de testes da F04 · Criação de canais e convite para canal privado

Escrito pelo fluxo da skill `playwright-cli` (planejar, gerar e corrigir), no contêiner `e2e`.
O que é coberto é da spec da F04 ([spec.md](../../../docs/funcionalidades/04-criacao-de-canais-e-convite-para-canal-privado/spec.md),
"Decisões de teste"); este plano é dono dos passos de cada cenário.

## Visão geral

Criar um Canal público pela tela inclui todas as Pessoas do banco de desenvolvimento, e os testes
do projeto principal contam com Pessoas fora de qualquer Canal. Por isso os testes que criam Canal
público pela tela ficam em `e2e/canais-publicos/`, no projeto `canais-publicos` do Playwright, que
roda depois do projeto principal; cada teste apaga no fim os Canais que criou. O nome digitado é
`E2E Canal <sufixo>`, que a tela normaliza para `e2e-canal-<sufixo>`.

## Cenários

### 1. Criar um Canal público

**Seed:** `e2e/seed.spec.ts`

#### 1.1. cria o Canal pelo teclado e cai nele

**File:** `e2e/canais-publicos/criar-canal-publico.spec.ts`

**Steps:**
  1. Focar "Adicionar canal" e apertar Enter
    - expect: o diálogo "Criar canal" abre com o foco no nome
  2. Digitar `E2E Canal <sufixo>!`
    - expect: o campo mostra `e2e-canal-<sufixo>`
  3. Tab, digitar o Tópico e apertar Enter
    - expect: o diálogo fecha, a Conversa abre com "Este é o começo do canal" e o Tópico, o foco
      vai para a caixa de mensagem, o Canal aparece na barra lateral, e há um Canal só com o nome

#### 1.2. Esc fecha sem criar

**File:** `e2e/canais-publicos/criar-canal-publico.spec.ts`

**Steps:**
  1. Abrir o diálogo e preencher o nome
  2. Apertar Esc
    - expect: o diálogo fecha, o foco volta a "Adicionar canal" e nenhum Canal é criado
  3. Abrir de novo
    - expect: o nome está vazio

#### 1.3. o nome repetido aparece no campo

**File:** `e2e/canais-publicos/criar-canal-publico.spec.ts`

**Steps:**
  1. Com um Canal que já existe, tentar criar outro com o mesmo nome
    - expect: "Já existe um canal chamado #nome." no campo, que fica inválido, e o diálogo aberto

#### 1.4. a falha mantém o que foi preenchido e a nova tentativa cria um Canal só

**File:** `e2e/canais-publicos/falha-ao-criar.spec.ts`

**Steps:**
  1. Com a resposta da criação perdida no caminho (`route.fetch` e depois `route.abort`), preencher
     e criar
    - expect: "Não foi possível criar o canal. Tente de novo." com o nome e o Tópico preenchidos
  2. Com a rede de volta, criar de novo
    - expect: a Conversa do Canal abre, e há um Canal só com o nome

### 2. Acessibilidade

#### 2.1. criar-canal-sem-violacoes

**File:** `e2e/canais-publicos/criar-canal-sem-violacoes.spec.ts`

**Steps:**
  1. Abrir o diálogo
    - expect: o axe não acha violações
  2. Provocar o erro no nome
    - expect: o axe não acha violações
