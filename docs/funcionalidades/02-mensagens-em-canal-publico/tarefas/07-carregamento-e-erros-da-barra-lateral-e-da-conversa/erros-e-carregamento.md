# Verificação do carregamento e dos erros (F02-T07)

2026-11-09 · ambiente de desenvolvimento, Chromium do contêiner `e2e`.

Com a API do chat parada, a verificação da Sessão também falha, e o layout mostra "Não foi possível
verificar sua sessão" antes da barra lateral e da Conversa. Por isso, cada estado foi provocado
numa tabela só, com a Sessão funcionando, como na verificação da F02-T06.

## Roteiro

O agente rodou um roteiro temporário do Playwright, fora do repositório, com uma Pessoa de teste
Membro de um Canal com três Mensagens:

1. **Barra lateral carregando.** Uma transação travou a tabela `conversations` (`LOCK TABLE … IN
   ACCESS EXCLUSIVE MODE`), e a Conversa foi aberta pelo endereço. A barra lateral mostrou as
   linhas de esqueleto, com `role="status"` e o texto "Carregando suas conversas"; a área da
   Conversa, o cabeçalho em esqueleto e "Histórico carregando" (captura `barra-lateral-carregando`).
   A trava foi desfeita, e a Conversa abriu com o nome no cabeçalho.
2. **Histórico carregando.** A trava passou para a tabela `messages`. O cabeçalho saiu com o nome
   do Canal, a área mostrou os esqueletos, com "Carregando as mensagens" para o leitor de tela, e a
   caixa de mensagem ficou desabilitada (captura `historico-carregando`). Desfeita a trava, o
   histórico chegou (`data-ready`).
3. **Erro do histórico.** A tabela `messages` foi renomeada para `messages_fora`, e a Conversa foi
   aberta de novo: o cabeçalho com o nome, "Não foi possível carregar as mensagens desta conversa."
   e "Tentar de novo" (captura `historico-erro`). Com a tabela de volta, o clique em "Tentar de
   novo" trouxe o histórico.
4. **Erro da barra lateral.** A tabela `conversations` foi renomeada para `conversations_fora`. A
   barra lateral mostrou "Não foi possível carregar suas conversas." e "Tentar de novo", com o
   trilho e o resto do shell de pé (captura `barra-lateral-erro`). Sem a Conversa, a área mostra o
   erro do histórico sem cabeçalho. Com a tabela de volta, o "Tentar de novo" da barra lateral
   trouxe a lista, com a linha do Canal ativa.
5. **Seção recolhida e linha ativa.** O clique em "Canais" recolheu a seção (captura
   `secao-recolhida`), e o segundo clique a expandiu (captura `linha-ativa`).

No fim, `to_regclass` confirmou as duas tabelas no lugar.

## Resultado

As cinco etapas passaram. As capturas estão em `capturas/`, nos dois temas, e a comparação com o
Figma está em `validacao-visual.md`.
