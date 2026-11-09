<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->


## Comandos

Todos rodam no contêiner `web`, a partir da raiz do repositório:

```bash
docker compose -f compose.yaml exec web <comando>
```

| Comando | O que faz |
| --- | --- |
| `pnpm dev --hostname 0.0.0.0` | Sobe o servidor de desenvolvimento (`http://localhost:3000`) |
| `pnpm lint` | ESLint com as regras do `eslint-config-next` |
| `pnpm exec tsc --noEmit` | Checagem de tipos |
| `pnpm build` | Compila a aplicação para produção |

## Server Components

Todo componente nasce como Server Component. O `"use client"` precisa de um motivo: estado ou efeito, manipulador de evento, API do navegador ou hook que só existe no cliente. Buscar dados, ler cookies, formatar valores e montar layout não são motivo.

## Estrutura de pastas

O código fica em `src/`.

```
app/         Contém os Server Components, páginas, layouts e rotas da aplicação.
  queries/   Contém os arquivos de consultas (queries) da aplicação.
  actions/   Contém os arquivos de ações do servidor (Server Actions) da aplicação.
  components/ Contém os componentes reutilizáveis da aplicação.
  hooks/      Contém os hooks personalizados da aplicação.
  utils/      Contém funções utilitárias da aplicação.
  services/   Contém os arquivos de serviços da aplicação.
public/      Arquivos estáticos, como imagens e fontes.
styles/      Arquivos de estilo globais.
```

## API Externas

A comunicação com APIs será feita através do `fetch`, mas, não deve ser feita diretamente nos componentes ou Server Actions. Em vez disto, crie serviços http dedicados na pasta `app/services/` e utilize-os nos componentes ou Server Actions.




