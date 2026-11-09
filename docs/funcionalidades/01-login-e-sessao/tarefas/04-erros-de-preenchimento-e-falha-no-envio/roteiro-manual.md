# Roteiro manual: Acessibilidade da tela Entrar no Lighthouse (CA7)

Feito por uma pessoa, no Chrome do computador (spec da F01, "Roteiro manual").

## Passos

1. Suba o ambiente (`AGENTS.md` da raiz, "Subir e derrubar"), com a web e a API do chat de pé.
2. Abra uma janela anônima do Chrome em `http://localhost:3000/entrar`.
3. Abra o DevTools (F12) e vá à aba Lighthouse.
4. Marque só a categoria Accessibility, o modo Navigation e o dispositivo Desktop.
5. Clique em "Analyze page load" e espere o relatório.
6. Repita com a tela em erro de validação: clique em "Entrar" com os campos vazios e, na aba
   Lighthouse, use o modo Snapshot.

## Resultado

| Medição | Nota | Quem mediu | Data |
| --- | --- | --- | --- |
| Entrar, carregamento (Navigation) | _a preencher_ | _a preencher_ | _a preencher_ |
| Entrar, erro de validação (Snapshot) | _a preencher_ | _a preencher_ | _a preencher_ |

O esperado é 100 nas duas. Uma nota menor vira correção nesta tarefa ou uma tarefa nova.

O axe, que cobre boa parte das mesmas regras, roda nas telas Entrar (com e sem erro) e Home pelo
Playwright, em `e2e/acessibilidade/entrar-e-home-sem-violacoes.spec.ts`, sem violações.
