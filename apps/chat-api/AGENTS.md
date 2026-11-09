## Arquitetura

O projeto segue uma arquitetura em camadas, com separação clara entre a interface de usuário (HTTP), a lógica de negócio (services) e a infraestrutura (repositories, banco de dados, e-mail, etc.).

## Design

O projeto segue os princípios de SOLID:

- **S**: Single Responsibility Principle - um módulo (conceito de unidade de código, como uma classe ou um service) deve ser responsável por um, e apenas um, ator.
- **O**: Open/Closed Principle (Princípio Aberto/Fechado) - módulos devem estar abertos para extensão, mas fechados para modificação.
- **L**: Liskov Substitution Principle (Princípio da Substituição de Liskov) - subclasses devem poder substituir suas classes base sem alterar o comportamento esperado.
- **I**: Interface Segregation Principle (Princípio da Segregação de Interfaces) - interfaces específicas são melhores do que uma interface genérica e inchada.
- **D**: Dependency Inversion Principle (Princípio da Inversão de Dependência) - módulos de alto nível não devem depender de módulos de baixo nível; ambos devem depender de abstrações.

Os serviços do projeto seguem os princípios do Application Layer, do Martin Fowler, mantendo a lógica de negócio isolada da infraestrutura e da interface de usuário.

## Comandos

Todos rodam no contêiner `api`, a partir da raiz do repositório:

```bash
docker compose -f compose.yaml exec api <comando>
```

| Comando | O que faz |
| --- | --- |
| `pnpm start:dev` | Sobe a API em modo watch (`http://localhost:3001` na máquina) |
| `pnpm test` | Suíte de unidade (`*.spec.ts`) |
| `pnpm test:watch` | Roda os testes em modo watch |
| `pnpm test:cov` | Roda os testes e gera relatório de cobertura |
| `pnpm lint` | oxlint com regras que usam tipos |
| `pnpm format` | Prettier em `src/` e `test/` |
| `pnpm exec tsc --noEmit` | Checagem de tipos |
| `pnpm build` | Compila para `dist/` |

O `pnpm lint` só aponta os problemas, sem corrigir. A formatação é conferida à parte, pelo `pnpm format`.

## Verificação completa

O termo está definido no `AGENTS.md` da raiz, seção "Planejamento". Na API, rode no contêiner `api`, nesta ordem:

1. `pnpm lint`
2. `pnpm exec tsc --noEmit`
3. `pnpm test`
4. `pnpm test:int`
5. `pnpm test:e2e`
6. `pnpm build`

## Testes

O arquivo de teste leva o nome do arquivo testado. O sufixo define o nível do teste e a suíte que o executa:

| Nível | Sufixo | Onde fica | O que exercita |
| --- | --- | --- | --- |
| Unidade | `.spec.ts` | Ao lado do código, em `src/` | Testes de unidade testam uma classe isolada |
| Integração | `.int-spec.ts` | Ao lado do código, em `src/` | Testes de integração exercitam uma peça com suas dependências reais |
| Ponta a ponta | `.e2e-spec.ts` | Em `test/` | A aplicação inteira por HTTP

**Onde cada regra é provada:** as regras de negócio são provadas pelos testes de ponta a ponta, pelas rotas, com banco e e-mail reais. O teste de unidade de um service é opcional, e vale quando a regra tem muitos casos que seriam lentos ou repetitivos pelas rotas. Funções puras têm teste de unidade. A spec da funcionalidade pode restringir isso, e ela prevalece.

## Aplicação HTTP

- **Filtro de erros e validação:** O filtro de erros e a validação de entrada são registrados no `AppModule` (`APP_FILTER` e `APP_PIPE`), e não no `main.ts`, para valerem também nos testes.

# A camada de serviços

Um service recebe e devolve dados simples e tipos do domínio. Ele tem de poder ser chamado de um controller, de uma tarefa do worker ou de um teste unitário sem nenhuma adaptação.

Antes de adicionar um import num arquivo de service, confira em qual dos dois grupos ele cai:

**Pode importar** e usar no service:

- `Injectable`, `Inject` e `Logger` do `@nestjs/common`
- Entidades, tipos e erros de domínio do próprio módulo
- O repository e os outros services do próprio módulo
- Utilitários puros, sem entrada e saída

**Não pode importar** e usar no service:

- `HttpException` e as filhas (`NotFoundException`, `BadRequestException` etc.) e `HttpStatus`
- `Request` e `Response` do Express, e os decorators de rota (`@Req`, `@Body`, `@Headers`)
- Repository, tabelas ou tipos internos de outro módulo
- `process.env`, direto. A configuração chega pelo módulo de config, por injeção.

A mesma regra vale para o repository: ele não importa nada de HTTP.

### Erros

O service lança erro de domínio, e só o exception filter global conhece o HTTP.

## Configuração

Toda configuração entra no projeto por um módulo de config próprio, em `src/config/`, feito com `@nestjs/config`.

