# AGENTS.md

## Documentos

Em `docs/` estão os documentos que definem o produto, a arquitetura e os detalhes de implementação. Abaixo estão os principais do projeto:

1. `docs/product-brief.md`: o quê e para quem. Escopo do MVP, o que fica fora, planos e métricas.
2. `docs/hld.md`: High-level design, documento de arquitetura de alto nível. Aqui ficam as decisões de arquitetura, os fluxos principais e a visão geral do sistema.
3. `docs/lld.md`: Low-level design, documento de arquitetura de baixo nível. Aqui ficam os detalhes de implementação.
4. `docs/design-system.md`: linguagem visual da interface. Aqui ficam os tokens de cor, tipografia, espaçamento, raio e sombra, os estados de interação, os componentes, o comportamento responsivo e o fluxo de trabalho com o Figma.
5. `GLOSSARY.md`, na raiz: o vocabulário do domínio do produto. Use esses termos nos documentos e no planejamento.

Cada projeto tem o próprio `AGENTS.md`, com os comandos, as particularidades da stack e as práticas de código dele:

- `apps/chat-api/AGENTS.md`: API em NestJS.
- `apps/web/AGENTS.md`: frontend em Next.js.

**Onde cada informação mora**

- **O que o sistema faz** fica em `docs/`: escopo, arquitetura, esquema, contrato, regras de negócio e configuração.
- **Nunca nos dois.** Uma informação tem um dono só, e o outro arquivo aponta para ele pelo nome do documento e da seção, sem repetir o conteúdo.
- **HLD e LLD mudam pela skill deles.** Quando uma tarefa muda algo que o `docs/hld.md` ou o `docs/lld.md` registra, carregue a skill `hld` ou `lld` e use o modo atualizar antes de editar o arquivo.
- **Informações que deveriam estar nos arquivos de memória** como AGENTS.md e rules, não devem ser repetidas nos documentos de arquitetura. Faça ponteiros destes arquivos para os arquivos de memória correspondentes.

## Execução no Docker

Tudo roda dentro dos contêineres do Docker Compose: instalação de dependências, servidor de desenvolvimento, testes, lint, compilação do TypeScript e qualquer outro comando do projeto. **Nunca rode `pnpm`, `node` ou `npx` direto na máquina.**

O ambiente de desenvolvimento usa o `compose.yaml`, na raiz, com quatro serviços:

| Serviço | O que é | Endereço na máquina | Endereço entre contêineres |
| --- | --- | --- | --- |
| `web` | Frontend em Next.js | `http://localhost:3000` | `http://web:3000` |
| `chat-api` | API em NestJS, REST e WebSocket | `http://localhost:3001` | `http://chat-api:3000` |
| `postgres` | PostgreSQL, com os bancos `chat`, `agents` e `business` | `localhost:5432` | `postgres:5432` |
| `s3` | Emulador do S3 (`seaweedfs`) | `http://localhost:8333` | `http://s3:8333` |

Os contêineres `web` e `chat-api` instalam as dependências ao subir e depois ficam parados, sem iniciar a aplicação. Os comandos rodam neles com `docker compose -f compose.yaml exec <serviço> <comando>` e os de cada projeto estão no `AGENTS.md` dele.

### Subir e derrubar

```bash
docker compose -f compose.yaml up -d --build --wait
docker compose -f compose.yaml exec web pnpm dev --hostname 0.0.0.0
docker compose -f compose.yaml exec chat-api pnpm start:dev
```

O `--wait` segura o primeiro comando só até o `postgres` e o `s3` ficarem prontos. A instalação das dependências continua dentro de `web` e `chat-api` depois disso e, na primeira subida, leva alguns minutos: acompanhe com `docker compose -f compose.yaml logs -f <serviço>` antes de rodar os outros dois. As migrações não rodam na subida. Os outros dois ficam presos ao terminal, então rode cada um em segundo plano. O `--hostname 0.0.0.0` é necessário para que a web aceite conexões de fora do contêiner.

**Derrubar**

```bash
docker compose -f compose.yaml down
```

**Procedimentos raros**

**Recomeçar do zero.** Para apagar os dados e recriar o banco:

```bash
docker compose -f compose.yaml down -v
```

O `-v` apaga os volumes do banco e do armazenamento: na próxima subida, o script de `docker/postgres/init/` recria os bancos e os papéis, sem tabelas. Depois, suba o ambiente como em "Subir e derrubar".

**A instalação falhou.** O contêiner `web` ou `chat-api` fica de pé mesmo quando o `pnpm install` falha, então o erro só aparece no log:

```bash
docker compose -f compose.yaml logs chat-api
```

Depois do conserto, rode a instalação de novo no contêiner, com `docker compose -f compose.yaml exec chat-api pnpm install`.

### Rede entre serviços

Na conexão entre serviços (banco, storage), seja em variável de ambiente, arquivo de configuração ou código, **o host é sempre o nome do serviço do Compose**, como na coluna "Endereço entre contêineres" da tabela, e nunca `localhost` nem `127.0.0.1`: dentro de um contêiner, `localhost` é o próprio contêiner.

**Exceção:** quando o processo fala com algo que roda no mesmo contêiner, o endereço é `127.0.0.1`. É o caso do healthcheck de um serviço, que confere o próprio contêiner, e de um teste que abre um servidor temporário no contêiner onde roda.

## Design e Figma

O Figma é a ferramenta de design do projeto, acessada pelo servidor MCP do plugin `figma`.

**Arquivo do Figma:** <https://www.figma.com/design/plW17JDOoRHydUJIIi2u87/slack>

**Sempre que a tarefa envolver design ou interface, leia antes o `docs/design-system.md`**, seja para desenhar no Figma, seja para implementar uma tela ou um componente no código. Ele define os tokens, os componentes e o fluxo de trabalho com o Figma (sincronia, passos do Figma para o código, assets e validação visual), e as regras dele são obrigatórias.

## Convenções de Git

- **Branch principal:** `main`. Nunca faça commit direto nela.
- **Branches de trabalho:** `feature/*`, `bugfix/*`, `hotfix/*` e `docs/*`, criadas a partir da `main` e integradas por pull request.
- **Commits:** mensagens curtas e descritivas, focadas no porquê da mudança.
- **Merge:** o merge é decisão do usuário. O agente só o faz quando o usuário autoriza expressamente aquele PR ou aquela tarefa. Sem autorização expressa, o agente não faz o merge, e uma negação do `gh pr merge` não se contorna por outro caminho.

## Consulta à documentação de bibliotecas

Quando precisar consultar a documentação de uma biblioteca, use o context7 para buscar informações atualizadas e precisas.

## Agent Skill Usage

Sempre carregue as skills necessárias para a tarefa em questão.
Existem diversas skills de convenções e boas práticas que podem ser carregadas conforme a necessidade da tarefa, além das específicas para cada domínio ou tecnologia utilizada.

Quando uma skill diverge dos arquivos de memory ou rules, o que está no AGENTS.md ou rules prevalece.
