# Roteiro manual da F03-T07

Feito por uma pessoa, no Chrome da máquina, com o ambiente de desenvolvimento de pé (`AGENTS.md` da
raiz, "Subir e derrubar"). Cobre o que os testes automáticos não alcançam: a nota do Lighthouse e
uma queda de verdade da rede e do computador (spec da F03, "Decisões de teste").

**Situação:** a rodar por uma pessoa. O agente que implementou a tarefa não tem como desligar o
Wi-Fi nem suspender o computador, e a nota do Lighthouse é lida no Chrome DevTools da máquina.

## Preparação

1. Criar duas contas pelo comando de contas e um Canal com as duas
   (`apps/chat-api/AGENTS.md`, "Comandos").
2. Entrar com a primeira conta no Chrome e com a segunda numa janela anônima, as duas no mesmo
   Canal, com umas 40 Mensagens enviadas para haver rolagem.

## 1. Lighthouse com a faixa e a pílula

1. Na primeira janela, rolar a lista para cima e, pela segunda, enviar uma Mensagem: a pílula
   "Novas mensagens" aparece.
2. Pelo DevTools, aba Network, pôr "Offline": em 3 s aparece a faixa "Sem conexão em tempo real.
   Reconectando…".
3. Com as duas na tela, rodar o Lighthouse, só a categoria Accessibility, modo Desktop.
   - Esperado: nota 100.
4. Voltar a rede a "No throttling".

## 2. Queda de verdade

1. Com as duas janelas no Canal, desligar o Wi-Fi da máquina (ou tirar o cabo) por 1 min.
   - Esperado: a faixa aparece em até 15 s; o envio pela primeira janela mostra "Não foi possível
     enviar.".
2. Religar a rede.
   - Esperado: a faixa some, o socket volta sozinho, e a Mensagem que falhou pode ser reenviada por
     "Tentar de novo" sem duplicar.
3. Suspender o computador por 1 min, com a segunda conta enviando uma Mensagem de outro aparelho
   durante a suspensão (ou pela janela anônima antes de suspender, se for o mesmo computador).
4. Acordar o computador.
   - Esperado: a faixa aparece enquanto reconecta e some; a Mensagem enviada durante a suspensão
     aparece uma vez, sem recarregar a página.

## Resultado

| Passo | Resultado | Quem | Data |
| --- | --- | --- | --- |
| 1. Lighthouse (nota) | A preencher | | |
| 2. Wi-Fi desligado por 1 min | A preencher | | |
| 2. Computador suspenso por 1 min | A preencher | | |
