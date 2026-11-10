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

### 3. Canal privado

Os testes do Canal privado ficam em `e2e/canais-privados/`, no projeto principal: o Canal privado
só tem quem o criou e não mexe nas outras Pessoas.

#### 3.1. cria o Canal privado pelo Switch e cai nele

**File:** `e2e/canais-privados/criar-canal-privado.spec.ts`

**Steps:**
  1. Abrir o diálogo, preencher o nome e ligar "Tornar privado" pelo Espaço
    - expect: o Switch fica ligado
  2. Criar
    - expect: a Conversa abre, com o cadeado no cabeçalho e na linha da barra lateral, e só quem
      criou é Membro

#### 3.2. o Canal privado fica em ordem alfabética junto dos públicos, com o cadeado

**File:** `e2e/canais-privados/privado-junto-dos-publicos.spec.ts`

**Steps:**
  1. Com um Canal privado entre dois públicos, entrar
    - expect: a barra lateral mostra os três em ordem, só o privado com o cadeado

#### 3.3. quem não é Membro não vê o Canal privado na barra lateral nem pelo endereço

**File:** `e2e/canais-privados/quem-nao-e-membro-nao-ve.spec.ts`

**Steps:**
  1. Com um Canal privado só da primeira Pessoa, a segunda entra
    - expect: a Home vazia, sem o Canal na barra lateral
  2. A segunda abre o endereço do Canal
    - expect: "Conversa não encontrada"

### 4. Canais novos na barra lateral

Ficam em `e2e/canais-publicos/`, porque criam Canal público pela tela.

#### 4.1. o Canal público criado por outra Pessoa aparece na barra lateral sem recarregar

**File:** `e2e/canais-publicos/canal-novo-sem-recarregar.spec.ts`

**Steps:**
  1. As duas Pessoas no mesmo Canal; a segunda com um rascunho na caixa de mensagem
  2. A primeira cria um Canal público
    - expect: o Canal aparece na barra lateral da segunda, em ordem, sem recarregar a página,
      sem abrir o Canal e com o foco e o rascunho na caixa de mensagem

#### 4.2. o reset recarrega a lista e traz o Canal criado durante a queda

**File:** `e2e/canais-publicos/canal-novo-depois-da-queda.spec.ts`

**Steps:**
  1. A segunda Pessoa fica offline, e a época dos eventos é apagada
  2. A primeira cria um Canal público
  3. A rede volta
    - expect: o `sync` com `reset` busca a lista de novo, e o Canal aparece

### 5. Adicionar Pessoas ao Canal privado

Ficam em `e2e/canais-privados/`. As Pessoas buscadas ganham nome único (`insertUniquePerson`),
porque o banco de desenvolvimento tem milhares de Pessoas com os nomes padrão das fixtures.

#### 5.1. adiciona pela busca e o Canal aparece para quem entrou, com as Mensagens

**File:** `e2e/canais-privados/adicionar-pessoas-na-criacao.spec.ts`

**Steps:**
  1. Quem cria um Canal privado passa ao passo, com o foco na busca, e escolhe a outra Pessoa pelo
     teclado
    - expect: ela aparece entre as escolhidas, com o botão de tirar
  2. Adicionar
    - expect: o Canal abre, com as duas Pessoas como Membros
  3. Na aba da outra Pessoa
    - expect: o Canal aparece na barra lateral sem recarregar, com o cadeado
  4. A primeira envia, a outra abre o Canal, e a primeira envia de novo
    - expect: a Mensagem de antes aparece ao abrir, e a nova chega em tempo real

#### 5.2. Pular, Esc e o X abrem o Canal só com quem o criou

**File:** `e2e/canais-privados/pular-adicionar-pessoas.spec.ts`

#### 5.3. a falha mantém as escolhidas e a nova tentativa adiciona

**File:** `e2e/canais-privados/falha-ao-adicionar.spec.ts`

#### 5.4. adicionar-pessoas-sem-violacoes

**File:** `e2e/canais-privados/adicionar-pessoas-sem-violacoes.spec.ts`
