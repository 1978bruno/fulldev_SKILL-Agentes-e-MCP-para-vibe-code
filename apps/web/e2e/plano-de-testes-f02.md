# Plano de testes da F02 · Mensagens em canal público

Escrito pelo fluxo da skill `playwright-cli` (planejar, gerar e corrigir), no contêiner `e2e`.
O que é coberto é da spec da F02 ([spec.md](../../../docs/funcionalidades/02-mensagens-em-canal-publico/spec.md),
"Decisões de teste"); este plano é dono dos passos de cada cenário.

## Visão geral

A Pessoa vê os Canais públicos de que é Membro na barra lateral, abre um, lê as Mensagens e envia
outras. Cada teste cria a própria Pessoa pela fixture `person` e os próprios Canais, direto no
banco, com nome de prefixo `e2e-` e só as participações que o teste passa (`memberChannel` ou
`insertChannel`). As Mensagens com datas conhecidas vêm de `insertMessages`.

## Cenários

### 1. Abrir um Canal

**Seed:** `e2e/seed.spec.ts`

#### 1.1. abrir-canal-pela-barra-lateral

**File:** `e2e/conversa/abrir-canal-pela-barra-lateral.spec.ts`

**Steps:**
  1. Logada, com dois Canais (`e2e-a-…` e `e2e-b-…`), abrir `/`
    - expect: a seção "Canais" lista os dois, em ordem alfabética
    - expect: a barra lateral não tem "Adicionar canal", "Mensagens diretas" nem "Agentes"
  2. Clicar no segundo Canal
    - expect: a URL é `/conversas/<id>` e o título é o nome do Canal

#### 1.2. abrir-canal-pelo-teclado

**File:** `e2e/conversa/abrir-canal-pelo-teclado.spec.ts`

**Steps:**
  1. Com o foco no primeiro Canal da barra lateral, apertar Tab
    - expect: o foco está no segundo Canal
  2. Apertar Enter
    - expect: a URL é a do segundo Canal e o título é o nome dele

#### 1.3. conversa-nao-encontrada

**File:** `e2e/conversa/conversa-nao-encontrada.spec.ts`

**Steps:**
  1. Logada, abrir `/conversas/<uuid que não existe>`
    - expect: "Conversa não encontrada" e "Ela não existe ou você não participa dela."
  2. Clicar em "Voltar ao início"
    - expect: a Home vazia, porque a Pessoa não é Membro de nenhum Canal

### 2. Ler as Mensagens

#### 2.1. ler-as-mensagens-recentes

**File:** `e2e/conversa/ler-as-mensagens-recentes.spec.ts`

**Steps:**
  1. Abrir um Canal com o Tópico "Conversas do time" e três Mensagens de "Bruno Lima"
    - expect: o título com o nome do Canal e o Tópico
    - expect: três itens na lista "Mensagens em #<nome>", com nome, hora no fuso padrão (08:40) e texto
    - expect: a última Mensagem visível e o foco na caixa de mensagem

### 3. Enviar uma Mensagem

#### 3.1. enviar-mensagem

**File:** `e2e/conversa/enviar-mensagem.spec.ts`

**Steps:**
  1. Escrever "linha um", Shift+Enter, "linha dois" e Enter
    - expect: a última Mensagem tem o nome da Pessoa e as duas linhas
    - expect: a caixa está vazia
  2. Recarregar a página
    - expect: a Mensagem continua na lista

#### 3.2. envio-com-sessao-revogada

**File:** `e2e/conversa/envio-com-sessao-revogada.spec.ts`

**Steps:**
  1. Com o Canal aberto, revogar as Sessões da Pessoa no banco, escrever e apertar Enter
    - expect: a URL é `/entrar?para=%2Fconversas%2F<id>`

### 4. Canal ao entrar e endereço do Canal

#### 4.1. home-abre-o-primeiro-canal

**File:** `e2e/conversa/home-abre-o-primeiro-canal.spec.ts`

**Steps:**
  1. Logada, com dois Canais, abrir `/`
    - expect: a URL é a do primeiro Canal em ordem alfabética

#### 4.2. entrar-pelo-endereco-do-canal

**File:** `e2e/conversa/entrar-pelo-endereco-do-canal.spec.ts`

**Steps:**
  1. Sem Sessão, abrir `/conversas/<id>`
    - expect: a URL é `/entrar?para=%2Fconversas%2F<id>`
  2. Entrar
    - expect: a URL é a do Canal e o título é o nome dele

#### 4.3. voltar-e-avancar

**File:** `e2e/conversa/voltar-e-avancar.spec.ts`

**Steps:**
  1. Abrir o primeiro Canal e trocar para o segundo pela barra lateral
  2. Voltar no navegador
    - expect: o primeiro Canal
  3. Avançar no navegador
    - expect: o segundo Canal

### 5. Histórico até a primeira Mensagem

Os testes desta seção esperam o histórico hidratado (`readyHistory`, que espera o `data-ready`)
antes de rolar, e montam o histórico com `insertHistory` ("Mensagem 1" a "Mensagem N").

#### 5.1. rolar-ate-o-comeco

**File:** `e2e/conversa/rolar-ate-o-comeco.spec.ts`

**Steps:**
  1. Abrir um Canal com 75 Mensagens
    - expect: 50 itens, o último "Mensagem 75"
  2. Rolar até o topo
    - expect: a página anterior chega pela rota `/api/conversations/<id>/messages?before=`
    - expect: 75 itens, o primeiro "Mensagem 1"
    - expect: a "Mensagem 26", que estava no topo, continua no mesmo lugar da tela
  3. Rolar até o topo de novo
    - expect: "Este é o começo do canal #<nome>"

#### 5.2. carregar-anteriores-pelo-teclado

**File:** `e2e/conversa/carregar-anteriores-pelo-teclado.spec.ts`

**Steps:**
  1. Sem o IntersectionObserver (só o teclado carrega), abrir um Canal com 60 Mensagens
  2. Shift+Tab da caixa de mensagem
    - expect: o foco está em "Carregar mensagens anteriores"
  3. Shift+Tab de novo, End e PageUp
    - expect: o foco está na área do histórico, e ela rola para cima
  4. Tab e Enter
    - expect: 60 itens e o começo do Canal

#### 5.3. falha-ao-carregar-anteriores

**File:** `e2e/conversa/falha-ao-carregar-anteriores.spec.ts`

**Steps:**
  1. Com a rota das anteriores abortada por `page.route`, rolar até o topo
    - expect: "Carregar mensagens anteriores" visível, fora de carga, e os 50 itens mantidos
  2. Liberar a rota e clicar no link
    - expect: 60 itens e o começo do Canal

#### 5.4. canal-sem-mensagens

**File:** `e2e/conversa/canal-sem-mensagens.spec.ts`

**Steps:**
  1. Abrir um Canal sem Mensagens
    - expect: "Este é o começo do canal #<nome>" com o Tópico, nenhum item e nenhum link de anteriores

#### 5.5. anteriores-com-sessao-revogada

**File:** `e2e/conversa/anteriores-com-sessao-revogada.spec.ts`

**Steps:**
  1. Com 60 Mensagens, revogar a Sessão e rolar até o topo
    - expect: a URL é `/entrar?para=%2Fconversas%2F<id>`

### 6. Acessibilidade

#### 6.1. conversa-sem-violacoes

**File:** `e2e/acessibilidade/conversa-sem-violacoes.spec.ts`

**Steps:**
  1. Abrir um Canal com Mensagens de duas Pessoas e analisar com o axe
    - expect: nenhuma violação
