# Verificação do erro da lista na Home (F02-T06)

2026-11-09 · ambiente de desenvolvimento, Chromium do contêiner `e2e`.

Com a API do chat parada, a verificação da Sessão também falha, e o layout mostra "Não foi possível
verificar sua sessão" antes de chegar à Home. Por isso a falha foi provocada só nas rotas de
Conversas, com a verificação da Sessão funcionando, como a spec descreve ("Verificações do
agente").

## Roteiro

O agente rodou um roteiro temporário do Playwright, fora do repositório, com uma Pessoa de teste
Membro de um Canal:

1. **Carregamento.** Uma transação travou a tabela `conversations` (`LOCK TABLE … IN ACCESS
   EXCLUSIVE MODE`), e a Home foi aberta. A área mostrou os esqueletos de "Home / Carregando", com
   `role="status"` e o nome "Carregando" (captura `home-carregando`). A trava foi desfeita, e a Home
   seguiu para o Canal.
2. **Erro.** A tabela foi renomeada para `conversations_fora`, e a Home foi aberta de novo. Ela
   mostrou "Não foi possível carregar a conversa", "Verifique sua conexão e tente de novo." e o
   botão "Tentar de novo" (captura `home-erro-da-lista`), com a URL ainda `/`.
3. **Tentar de novo.** A tabela voltou a `conversations`, e o clique em "Tentar de novo" levou a
   Pessoa a `/conversas/<id>` do Canal dela.

No fim, `to_regclass('conversations')` confirmou a tabela no lugar.

## Resultado

As três etapas passaram. As capturas estão na pasta `capturas/`, nos dois temas, e a comparação com
o Figma está em `validacao-visual.md`.
