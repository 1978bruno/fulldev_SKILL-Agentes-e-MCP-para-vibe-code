---
status: aceita
---

# 0024 · Canais e conversas diretas numa tabela só, com participação gravada

Canal público, canal privado e conversa direta ficam na mesma tabela `conversations`, distinguidos
por `kind`, e toda participação, inclusive a de canal público, é uma linha em
`conversation_members`. Assim mensagens, última leitura, contadores (ADR 0021) e a conferência de
acesso apontam sempre para uma conversa e um Membro, iguais para os três tipos: a F04 só acrescenta
um tipo, e a F07 incrementa os contadores nas linhas de participação.

Descartadas: tabelas separadas para canais e conversas diretas, que obrigariam as mensagens e os
contadores a ter duas referências opcionais; e participação implícita em canal público, sem linhas,
que deixaria a F07 e a F18 sem onde gravar.

Custo aceito: criar um canal público grava uma linha por Pessoa, e criar uma conta grava uma linha
por canal público. As duas operações tomam a mesma trava, para uma conta e um canal criados ao
mesmo tempo não deixarem a Pessoa fora do canal.
