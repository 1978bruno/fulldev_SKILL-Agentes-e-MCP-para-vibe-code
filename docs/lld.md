# LLD — Full Cycle Chat

2026-11-06 · Luiz Carlos · Status: rascunho · HLD: [hld.md](hld.md)

**Onde mora cada fato**

| Fato | Dono |
| --- | --- |
| Arquitetura, contêineres, integrações e motivos | [HLD](hld.md) |
| Decisões com porquê | `docs/adr/`, com o índice na seção "Decisões" deste documento e do HLD |
| Escopo e público | [Product brief](product-brief.md) |
| Vocabulário | `GLOSSARY.md` na raiz (planejado) |
| Linguagem visual (cores, componentes, microtexto) | [Figma](https://www.figma.com/design/plW17JDOoRHydUJIIi2u87/slack) |
| Contrato REST da API do chat | `apps/chat-api/openapi.json`, gerado pelo `@nestjs/swagger` (planejado) |
| Contrato REST do Serviço de agentes | `apps/agents/openapi.json`, gerado pelo FastAPI (planejado) |
| Catálogo de códigos de erro | Os snapshots OpenAPI, como enum na resposta de erro de cada rota (planejado) |
| Eventos do WebSocket | Tipos TypeScript em `packages/chat-events/` (planejado) |
| Schema do Banco do chat | `apps/chat-api/migrations/`, migrações do TypeORM (planejado) |
| Schema do Banco dos agentes | A definir |
| Schema do Banco de negócio | Script de carga em `apps/agents/scripts/` (planejado) |
| Schema das variáveis de ambiente | A definir |
| Práticas e comandos | `apps/*/AGENTS.md`, um por app, apontados pelo `AGENTS.md` da raiz (planejado) |

Os snapshots OpenAPI ficam gravados no repositório, e a CI falha quando o código muda o contrato
sem atualizar o snapshot.

## 1. Estrutura do código

Um repositório com três aplicações implantadas separadamente (HLD, seção 5) e um pacote de tipos
compartilhado. `web`, `chat-api` e `chat-events` são projetos pnpm independentes, cada um com o
seu lockfile, sem workspace ([ADR 0017](adr/0017-projetos-pnpm-independentes.md)); `chat-events`
entra em `web` e em `chat-api` como dependência `file:../../packages/chat-events`, e uma mudança
nele exige reinstalar nos dois projetos. O projeto `agents` é gerenciado pelo uv.

```
apps/
  web/            Frontend/BFF (Next.js)                              existe
  chat-api/       API do chat (NestJS): REST, WebSocket e o comando   existe
                  de contas e permissões (HLD, seção 2)
    migrations/   migrações do Banco do chat                          planejada
  agents/         Serviço de agentes e Worker (Python + ADK),         planejada
                  dois processos do mesmo projeto
    scripts/      script de carga do Banco de negócio                 planejada
packages/
  chat-events/    tipos dos eventos do WebSocket, usados por          planejada
                  chat-api e web
docs/             HLD, LLD, ADRs, brief
```

| Papel | Escolha | Por quê |
| --- | --- | --- |
| Frontend/BFF | Next.js com App Router | Next.js: HLD, seção 5 ([ADR 0002](adr/0002-next-bff-websocket-direto.md)); App Router: a definir |
| Leituras no cliente que o tempo real altera | SWR | A definir |
| Tempo real, no servidor e no cliente | Socket.IO | [ADR 0019](adr/0019-socket-io-tempo-real.md) |
| API do chat | NestJS | HLD, seção 5 |
| ORM e migrações do Banco do chat | TypeORM | [ADR 0018](adr/0018-typeorm-api-do-chat.md) |
| Snapshot do contrato da API do chat | `@nestjs/swagger` | Gera o OpenAPI a partir do código |
| Hash de senha | Argon2id | Primeira recomendação da OWASP para senhas |
| Gerenciador dos projetos TypeScript | pnpm, um projeto por pasta, sem workspace | [ADR 0017](adr/0017-projetos-pnpm-independentes.md) |
| Agentes | Python + Google ADK | [ADR 0003](adr/0003-agentes-python-google-adk.md) |
| HTTP do Serviço de agentes | FastAPI próprio, com as rotas chamando o `Runner` do ADK | A definir |
| Gerenciador do projeto Python | uv | A definir |
| Fila de pedidos demorados | A definir | — |
| Acesso ao modelo, trocável por configuração (HLD, seção 2) | A definir | — |
| Geração do PDF | A definir | — |
| Acesso ao Banco dos agentes e migrações | A definir | — |
| Validação das variáveis de ambiente | A definir | — |
| Parser da conferência de somente leitura | A definir | — |
| Log estruturado | A definir | — |

## 2. Componentes e dependências

Os tipos de peça de cada aplicação, o que cada tipo pode chamar e o diagrama das dependências
permitidas estão a definir, assim como os módulos de domínio da API do chat, do projeto `agents`
e do projeto `web`. O que já vale vem do HLD: o BFF dispara o agente
([ADR 0009](adr/0009-bff-dispara-agente.md)), o agente grava pela API do chat como bot
([ADR 0010](adr/0010-agente-grava-como-bot.md)) e o Worker nunca chama o modelo (HLD, seção 5).

### Integrações externas

Situação de todas: `planejada`.

**Armazenamento de objetos (S3)** — usado pelo Worker (gravar) e pela API do chat (URL).

| Operação | Recebe | Devolve | Garante |
| --- | --- | --- | --- |
| Gravar PDF | Chave e arquivo | Nada | Regravar a mesma chave substitui o arquivo; uma nova tentativa do Worker não duplica |
| Gerar URL de download | Chave e validade | URL assinada | Vencida a validade (`validade da URL do PDF`), a URL recusa |

**Fila de pedidos demorados** — o Serviço de agentes enfileira e o Worker consome.

| Operação | Recebe | Devolve | Garante |
| --- | --- | --- | --- |
| Enfileirar | Identificador de pedido e consulta já conferida | Nada | Enfileirar duas vezes o mesmo identificador gera uma tarefa só |
| Consumir | — | Uma tarefa ao Worker | Se o Worker falha, a tarefa volta à fila até `tentativas do Worker` |

**Eventos por pessoa (Redis)** — usado pela API do chat para a reconexão (HLD 6.2).

| Operação | Recebe | Devolve | Garante |
| --- | --- | --- | --- |
| Guardar evento | Pessoa e evento | Identificador crescente por pessoa | A ordem dos identificadores é a ordem dos eventos daquela pessoa |
| Ler desde | Pessoa e último identificador confirmado | Os eventos seguintes, ou "perdido" | "Perdido" quando o identificador já saiu da `retenção dos eventos de reconexão`; o cliente então recarrega pelo histórico |

**Contadores (Redis)** — usados pelo Serviço de agentes (HLD 6.3).

| Operação | Recebe | Devolve | Garante |
| --- | --- | --- | --- |
| Conferir e contar pedido | Pessoa | Permitido ou negado | Nega acima do `limite de pedidos por pessoa` |
| Somar custo | Pedido e custo | Se o teto foi atingido | Compara com o `teto de custo por pedido` |

Com o Redis fora, as operações de contadores falham e o pedido é recusado (HLD, seção 8, "Erros,
novas tentativas e idempotência").

## 3. Conceitos transversais de implementação

### Segurança

- **Cookie de sessão:** `httpOnly`, `Secure` e válido para os subdomínios (HLD 6.1). O valor de
  `SameSite` e a defesa contra CSRF estão a definir.
- **Identificador de sessão:** formato e forma de guardar no Banco do chat a definir.
- **Senha:** guardada como hash Argon2id.
- **Limite de tentativas de login:** a chave (e-mail, IP ou os dois) está a definir; os números
  estão em "Valores e configuração". A origem do IP atrás do proxy da PaaS está a definir, porque
  depende da PaaS escolhida (HLD, seção 12).
- **Participação em canal privado e conversa direta:** o lugar no código onde a API do chat a
  confere está a definir.
- **Credenciais de bot e de serviço:** a forma (um segredo por processo ou por agente) está a
  definir. Toda ação de bot leva o identificador de pedido
  ([ADR 0011](adr/0011-identificador-de-pedido.md)).
- **Dados de negócio no tempo real:** uma mensagem marcada "dados de negócio" é emitida pelo
  WebSocket pessoa a pessoa. Quem tem permissão de dados recebe o evento com o conteúdo; os outros
  membros recebem o evento com a versão bloqueada. O evento guardado nos eventos de reconexão
  segue a mesma regra, por pessoa. Mensagens sem a marca saem num evento só para a conversa
  ([ADR 0020](adr/0020-dados-de-negocio-pessoa-a-pessoa.md); depende de mudança no HLD). Se uma
  função única monta a mensagem para cada destinatário (histórico, REST, evento e notificação)
  está a definir.

### Concorrência e idempotência

- **Envio de mensagem:** unicidade em (autor, identificador gerado no cliente). A inserção tolera
  o conflito: se o identificador já existe, a API devolve a mensagem já gravada, com o mesmo
  status de sucesso, e não gera de novo menções, notificações, contadores nem eventos.
- **Ação de bot:** unicidade em (identificador de pedido, tipo de ação). Tipos: resposta, pergunta
  ao usuário, aviso de início, entrega do PDF, criação de tarefa. A repetição devolve o que já foi
  gravado, sem nova mensagem, tarefa ou notificação.
- **Contadores de não lidas e de menções:** um registro por pessoa e conversa, somado de forma
  atômica na transação da mensagem (incremento no próprio `UPDATE`, sem ler antes) e zerado quando
  a pessoa lê ([ADR 0021](adr/0021-contadores-gravados.md); depende de mudança no HLD).
- **Última leitura:** só avança. A atualização é condicional: grava só se a nova posição for
  posterior à gravada; uma posição igual ou anterior, vinda de uma aba atrasada, não muda nada e
  não altera os contadores.

### Transações

O que precisa ser atômico é do HLD (seção 7, "Regras que pesam no desenho"): a mensagem com as
menções, as notificações e os contadores; a tarefa com a notificação dela. O evento só sai depois
do commit. Onde a transação começa, como passa de um módulo a outro e como o evento é publicado
depois do commit (publicação direta ou tabela de saída) estão a definir.

### Erros

- Corpo de erro nas três APIs (BFF, API do chat, Serviço de agentes):
  `{ "error": { "code": "...", "message": "...", "details": ... } }`. O `code` é estável; o
  `message` é para pessoas.
- O catálogo de códigos fica nos snapshots OpenAPI, como enum na resposta de erro de cada rota.
- Quem traduz exceção em resposta está a definir.
- **Mensagem gravada, mas o Serviço de agentes não recebeu o pedido** (HLD 6.3): o BFF responde
  sucesso, com a mensagem gravada e um campo que diz que o agente não recebeu o pedido. A tela
  mostra a mensagem enviada e um aviso de erro do agente ao lado.

### Logs

A regra do HLD vale para todos os projetos: logs estruturados, sem conteúdo de mensagens e sem
resultado de consultas (HLD, seção 8, "Observabilidade"). A biblioteca, os campos de correlação e
a lista completa do que nunca vai para o log estão a definir.

| Nível | Quando |
| --- | --- |
| info | Fim de cada requisição e de cada pedido a agente, com tempo de resposta e custo como campos |
| warn | Resposta barrada pelo lastro; limite de pedidos ou teto de custo atingido; tentativa de login bloqueada |
| error | Falha do modelo; tentativas do Worker esgotadas; exceção inesperada |

### Configuração

- Cada projeto tem um módulo de configuração só, que lê e valida as variáveis uma vez na subida.
  Nenhum outro arquivo lê `process.env` ou `os.environ`; as peças recebem a configuração já
  tipada.
- Faltou uma variável obrigatória: o processo falha na subida, com o nome da variável na
  mensagem, e nunca no primeiro uso. Assim, a conferência de saúde da PaaS barra a versão nova e
  mantém a anterior (HLD, seção 9).
- Cada projeto tem um `.env.example` gravado no repositório, com todas as variáveis e valores
  falsos; o `.env` real fica no `.gitignore`.
- A biblioteca de validação está a definir; a lista das variáveis fica em "Valores e
  configuração".

## 4. Dados

**Convenções** (tabelas nossas do Banco do chat e do Banco dos agentes; as tabelas de sessão do
ADK seguem o ADK):

- Nomes em `snake_case`, tabelas no plural (`messages`, `channel_members`); o TypeORM usa uma
  estratégia de nomes que converte os nomes do código.
- Id em UUID v7, gerado na aplicação ([ADR 0022](adr/0022-uuid-v7.md)).
- Datas em `timestamptz`, sempre em UTC, com `created_at` e `updated_at` em toda tabela. A
  conversão para o fuso de quem pediu acontece só na borda: na tela e no recorte "hoje" do agente.
- Exclusão física. A exceção é a mensagem: apagar zera o conteúdo e grava `deleted_at`, e a linha
  fica para mostrar "mensagem apagada" (HLD, seção 7).

O diagrama de entidades e relações está a definir. As unicidades e os contadores que as regras já
exigem estão em "Conceitos transversais de implementação", seção "Concorrência e idempotência".

| Banco | Entidade (HLD, seção 7) | Situação |
| --- | --- | --- |
| Chat | Pessoas (perfil, papel de administrador, permissão de dados) | a detalhar |
| Chat | Sessões | a detalhar |
| Chat | Canais e membros | a detalhar |
| Chat | Conversas diretas | a detalhar |
| Chat | Mensagens (autor pessoa ou bot, citação, marca "dados de negócio") | a detalhar |
| Chat | Menções | a detalhar |
| Chat | Última leitura e contadores por pessoa e conversa | a detalhar |
| Chat | Notificações | a detalhar |
| Chat | Tarefas | a detalhar |
| Chat | Pedidos aos agentes e ações de bot | a detalhar |
| Chat | Perguntas pendentes | a detalhar |
| Chat | Referência ao PDF de uma mensagem | a detalhar |
| Agentes | Registro de agentes conectados | a detalhar |
| Agentes | Sessões do ADK | criadas pelo ADK |
| Negócio | Dados de vendas | dono: script de carga |

## 5. Interfaces

**Convenções**

- Prefixo `/v1` na API do chat e no Serviço de agentes; `/api`, sem versão, no BFF, porque o
  Frontend e o BFF são implantados juntos. Uma mudança que quebra entre serviços sai como nova
  versão do prefixo, em duas implantações.
- Autenticação: o navegador fala com o BFF por cookie de sessão; o BFF leva a sessão à API do chat
  (forma a definir); o BFF chama o Serviço de agentes com a credencial de serviço; os bots chamam a
  API do chat com a credencial de bot e o identificador de pedido (forma em "Segurança").
- Campos do JSON em `snake_case`, nas três APIs.
- Paginação: a definir.
- Erros: "Conceitos transversais de implementação", seção "Erros".
- Eventos do WebSocket: tipos em `packages/chat-events/`, consumidos por `chat-api` e `web`.

**Índice das rotas**

O índice por domínio (BFF; API do chat, para o BFF e para os bots; Serviço de agentes) e a lista
de eventos do WebSocket estão a definir. O único comportamento já decidido:

| Método e caminho | Situação | Comportamento |
| --- | --- | --- |
| Envio de mensagem no BFF (caminho a definir) | a detalhar | Mensagem gravada e agente sem receber o pedido: "Conceitos transversais de implementação", seção "Erros" |

## 6. Estados e regras

As subseções desta parte (pedido ao agente, pergunta pendente, mensagem, sessão e login, consulta
a dados de negócio, limite de pedidos e teto de custo) e as regras de cada uma estão a definir. A
regra já decidida fica abaixo.

### 6.1 Tarefa

Dois estados: aberta e concluída (HLD 6.6).

- Só o responsável conclui e reabre a tarefa. Outra pessoa, inclusive quem delegou, recebe um
  erro do catálogo.
- Ao concluir ou reabrir, quem delegou é avisado (HLD 6.6).
- Concluir uma tarefa já concluída, ou reabrir uma aberta: a definir.

## 7. Processos de segundo plano

| Tarefa | Disparo | O que faz | Na falha | Situação |
| --- | --- | --- | --- | --- |
| Relatório em PDF (Worker) | Pedido na fila (HLD 6.5) | HLD 6.5 | Nova tentativa até `tentativas do Worker`; esgotadas, grava "não consegui" (HLD 6.5) | a detalhar |

A idempotência da tarefa (chave no S3 e entrega única) e outras rotinas (retenção dos PDFs,
sessões vencidas, perguntas pendentes vencidas) estão a definir.

## 8. Cliente

**Telas**

| Rota | Acesso | Lê | Ações | Situação |
| --- | --- | --- | --- | --- |
| A definir | Público | — | Entrar com e-mail e senha | a detalhar |
| A definir | Sessão | Histórico da conversa | Enviar, editar, apagar, citar; "digitando"; botões de resposta pronta | a detalhar |
| A definir (lateral) | Sessão | Conversas, com não lidas e menções | Abrir conversa | a detalhar |
| A definir | Sessão | Atividade: Menções, DMs, Tarefas | Abrir a mensagem; concluir e reabrir tarefa | a detalhar |
| A definir | Sessão | Perfil próprio e de outras pessoas | Editar o próprio perfil e a presença | a detalhar |
| A definir | Sessão | Busca de pessoas | Abrir conversa direta | a detalhar |
| A definir | Sessão | — | Criar canal; convidar para canal privado | a detalhar |
| A definir | Sessão; conectar e desconectar só para administrador | Agentes e estado de conexão | Conectar e desconectar agente | a detalhar |

**Leituras e tempo real.** A página carrega pelos Server Components. No cliente, o SWR guarda as
leituras que o tempo real altera (mensagens, não lidas, notificações), e cada evento do WebSocket
atualiza esse cache direto, sem nova requisição.

**Sessão no cliente.**

- O middleware do Next confere só se o cookie de sessão existe; sem ele, manda para "Entrar". A
  validação de verdade é da API do chat.
- Qualquer 401 vindo do BFF manda para "Entrar".
- Um 401 no WebSocket fecha a conexão e manda para "Entrar".

**Notificação do navegador.**

- A permissão do navegador é pedida só quando a pessoa liga a opção (brief, item 6 do escopo).
- A notificação sai do evento do WebSocket, com o chat aberto em alguma aba (HLD, seção 4).
- O clique abre a conversa posicionada na mensagem.

**Reação a erros da API.** 401: "Sessão no cliente". Mensagem gravada com erro do agente:
"Conceitos transversais de implementação", seção "Erros".

## 9. Valores e configuração

**Valores de regra**

| Nome | Valor | Onde vale | Constante ou variável |
| --- | --- | --- | --- |
| Limite de pedidos por pessoa | 10 por minuto (brief, RNF "Custo") | Serviço de agentes | A definir |
| Teto de custo por pedido | A definir | Serviço de agentes | A definir |
| Tentativas do Worker | A definir | Worker | A definir |
| Validade da URL do PDF | A definir | API do chat | A definir |
| Duração da sessão | A definir | API do chat | A definir |
| Tentativas de login e janela | A definir | API do chat | A definir |
| Validade do identificador de pedido | A definir | API do chat | A definir |
| Retenção dos eventos de reconexão | A definir | API do chat (Redis) | A definir |
| Tempo limite da consulta ao Banco de negócio | A definir | Serviço de agentes e Worker | A definir |
| Tamanho da página do histórico | A definir | API do chat | A definir |

**Variáveis de ambiente**

A definir. O que cada contêiner recebe está no HLD, seção 8, "Configuração e segredos".

## 10. Ambiente de desenvolvimento

A definir. O que substitui cada serviço de produção está no HLD, seção 9, "Implantação e
ambientes".

## 11. Decisões

| ADR | Decisão | Status |
| --- | --- | --- |
| [0017](adr/0017-projetos-pnpm-independentes.md) | Três projetos pnpm independentes, sem workspace | aceita |
| [0018](adr/0018-typeorm-api-do-chat.md) | TypeORM na API do chat | aceita |
| [0019](adr/0019-socket-io-tempo-real.md) | Socket.IO no tempo real | aceita |
| [0020](adr/0020-dados-de-negocio-pessoa-a-pessoa.md) | Mensagem de dados de negócio emitida pessoa a pessoa no WebSocket | aceita |
| [0021](adr/0021-contadores-gravados.md) | Contadores de não lidas e de menções gravados na transação | aceita |
| [0022](adr/0022-uuid-v7.md) | UUID v7 como id, gerado na aplicação | aceita |

As decisões que mudam o desenho estão no HLD, seção 10.

## 12. Questões em aberto

**Estrutura e bibliotecas**

- [ ] Biblioteca da fila no Redis (arq, Celery ou RQ).
- [ ] Acesso ao modelo: `LiteLlm` do ADK para os três provedores, ou Gemini nativo e `LiteLlm`
      para OpenAI e Anthropic.
- [ ] Biblioteca do PDF (WeasyPrint, ReportLab ou fpdf2).
- [ ] Acesso ao Banco dos agentes e migrações (SQLAlchemy com Alembic, ou SQL cru); com ela, o
      dono do schema desse banco.
- [ ] Biblioteca de validação das variáveis (zod, Joi, pydantic-settings); com ela, o dono do
      schema das variáveis.
- [ ] Parser da conferência de somente leitura (pglast ou sqlglot).
- [ ] Biblioteca de log estruturado (pino e structlog, ou o logger de cada framework).
- [ ] Porquê das escolhas sem motivo registrado: App Router, SWR, FastAPI próprio, uv; ADRs 0017,
      0018, 0019, 0021 e 0022.

**Componentes**

- [ ] Tipos de peça e dependências permitidas na API do chat, no Serviço de agentes e no Worker, e
      no `web`, com o diagrama.
- [ ] Módulos de domínio dos três projetos.
- [ ] Como o navegador chama o BFF: só Route Handlers (REST), ou Server Actions nas mutações.

**Conceitos transversais**

- [ ] `SameSite` do cookie e defesa contra CSRF.
- [ ] Formato do identificador de sessão e forma de guardá-lo.
- [ ] Credenciais de bot (por processo ou por agente) e credencial de serviço.
- [ ] Chave do limite de tentativas de login (e-mail, IP ou os dois).
- [ ] Origem do IP atrás do proxy (depende da PaaS, ainda aberta no HLD).
- [ ] Lugar da conferência de participação em canal privado e conversa direta.
- [ ] Função única que monta a mensagem para cada destinatário.
- [ ] Onde a transação começa e como passa entre módulos.
- [ ] Publicação do evento depois do commit: direta ou por tabela de saída.
- [ ] Quem traduz exceção em resposta.
- [ ] Campos de correlação dos logs.
- [ ] O que nunca vai para o log, além do que o HLD já diz.
- [ ] Contadores quando a leitura avança até uma mensagem que não é a última da conversa.

**Dados e interfaces**

- [ ] Canais e conversas diretas: uma tabela com tipo, ou tabelas separadas.
- [ ] Bots na mesma tabela das pessoas, ou não.
- [ ] Diagrama de entidades e relações; forma das tabelas.
- [ ] Paginação do histórico e das listas.
- [ ] Como o BFF leva a sessão à API do chat.
- [ ] Índice das rotas (BFF, API do chat para o BFF e para os bots, Serviço de agentes) e lista
      de eventos do WebSocket.

**Estados, regras e processos**

- [ ] Subseções de "Estados e regras": pedido ao agente (estados; resposta a uma pergunta como
      pedido novo ou continuação), pergunta pendente (quando termina), mensagem (exclusão com
      menções, notificações e contadores; edição que acrescenta menção), sessão e login, consulta
      a dados de negócio (comparação do lastro), limite de pedidos e teto de custo, presença e
      "digitando".
- [ ] Tarefa: concluir uma já concluída, ou reabrir uma aberta.
- [ ] Idempotência da tarefa do PDF (chave no S3, entrega única) e outras rotinas (retenção dos
      PDFs, sessões vencidas, perguntas pendentes vencidas).

**Valores, configuração e ambiente**

- [ ] Valores de regra marcados "A definir" em "Valores e configuração", e se o limite de pedidos
      é constante ou variável.
- [ ] Nomes, projetos e origem das variáveis de ambiente.
- [ ] Diferenças do ambiente local que mudam o código ou os testes.
