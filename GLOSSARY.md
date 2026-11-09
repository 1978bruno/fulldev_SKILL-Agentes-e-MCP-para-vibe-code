# Full Cycle Chat

Chat de equipe no estilo Slack em que agentes de IA entram como plugins. Este glossário guarda o
vocabulário do produto; os termos do processo de desenvolvimento ficam no `AGENTS.md`, seção
"Planejamento".

## Language

**Pessoa**:
Quem tem conta no workspace, criada pela empresa, e entra no chat com o próprio e-mail e senha.
_Avoid_: usuário, conta, membro

**Membro**:
Uma Pessoa enquanto participante de um canal. Fora de um canal, é só Pessoa.
_Avoid_: participante

**Sessão**:
O acesso de uma Pessoa ao chat num navegador, do momento em que ela entra até sair, a Sessão
vencer por falta de uso ou ser revogada. Vale para todas as abas daquele navegador.
_Avoid_: login (como substantivo), token

**Tarefa**:
Um trabalho que um agente delega a uma pessoa mencionada, a pedido de quem o mencionou; fica com
essa pessoa como responsável até ela concluí-lo, e pode ser reaberto. Não é a tarefa do
planejamento (`F01-T02`), definida no `AGENTS.md`.
_Avoid_: to-do, pendência
