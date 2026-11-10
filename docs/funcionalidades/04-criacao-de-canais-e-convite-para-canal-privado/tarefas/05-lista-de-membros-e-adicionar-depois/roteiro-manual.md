# Roteiro manual da F04-T05

Feito por uma pessoa, no Chrome da máquina, com o ambiente de desenvolvimento de pé (`AGENTS.md` da
raiz, "Subir e derrubar"). Cobre a nota do Lighthouse, que os testes automáticos não leem (spec da
F04, "Decisões de teste"). A checagem do axe, sem violações, já roda no Playwright para o diálogo
"Criar canal", o passo "Adicionar pessoas" e a lista de Membros.

**Situação:** a rodar por uma pessoa. O agente que implementou a tarefa não tem o Lighthouse no
contêiner `e2e`, e a nota é lida no Chrome DevTools da máquina.

## Preparação

1. Criar duas contas pelo comando de contas (`apps/chat-api/AGENTS.md`, "Comandos").
2. Entrar com a primeira no Chrome.

## 1. Diálogo "Criar canal"

1. Na barra lateral, "Adicionar canal".
2. Com o diálogo aberto, rodar o Lighthouse, só a categoria Accessibility, modo Desktop.
   - Esperado: nota 100.

## 2. Passo "Adicionar pessoas"

1. No diálogo, preencher o nome, ligar "Tornar privado" e criar.
2. No passo, buscar a segunda conta pelo nome e escolhê-la.
3. Rodar o Lighthouse como acima.
   - Esperado: nota 100.

## 3. Lista de Membros

1. Adicionar e, no Canal aberto, clicar no botão de Membros do cabeçalho.
2. Rodar o Lighthouse como acima.
   - Esperado: nota 100.

## Resultado

| Tela | Nota | Quem rodou e quando |
| --- | --- | --- |
| Diálogo "Criar canal" | a preencher | a preencher |
| Passo "Adicionar pessoas" | a preencher | a preencher |
| Lista de Membros | a preencher | a preencher |
