# Validação visual da F02-T07

Capturas da web em 1440 × 900, no Chromium do contêiner `e2e`, tiradas na verificação de
`erros-e-carregamento.md`, ao lado das capturas dos frames do Figma (arquivo `slack`, página
Telas). O tema escuro da web é o `data-theme="dark"` na raiz. No Figma, a página Telas está no modo
Dark da coleção Semantic; a captura clara aplicou o modo Light só a cada frame, removido depois.

| Estado | Frame | Web, claro | Figma, claro | Web, escuro | Figma, escuro |
| --- | --- | --- | --- | --- | --- |
| Barra lateral carregando | 25:19071 | ![](capturas/barra-lateral-carregando-claro.png) | ![](capturas/figma-barra-lateral-carregando-claro.png) | ![](capturas/barra-lateral-carregando-escuro.png) | ![](capturas/figma-barra-lateral-carregando-escuro.png) |
| Histórico carregando | 21:1869 | ![](capturas/historico-carregando-claro.png) | ![](capturas/figma-historico-carregando-claro.png) | ![](capturas/historico-carregando-escuro.png) | ![](capturas/figma-historico-carregando-escuro.png) |
| Erro ao carregar | 21:4642 | ![](capturas/historico-erro-claro.png) | ![](capturas/figma-historico-erro-claro.png) | ![](capturas/historico-erro-escuro.png) | ![](capturas/figma-historico-erro-escuro.png) |
| Barra lateral com erro | 25:19177 | ![](capturas/barra-lateral-erro-claro.png) | ![](capturas/figma-barra-lateral-erro-claro.png) | ![](capturas/barra-lateral-erro-escuro.png) | ![](capturas/figma-barra-lateral-erro-escuro.png) |
| Seção recolhida | 25:20813 | ![](capturas/secao-recolhida-claro.png) | ![](capturas/figma-secao-recolhida-claro.png) | ![](capturas/secao-recolhida-escuro.png) | ![](capturas/figma-secao-recolhida-escuro.png) |
| Linha ativa | 21:1869 | ![](capturas/linha-ativa-claro.png) | ![](capturas/figma-historico-carregando-claro.png) | ![](capturas/linha-ativa-escuro.png) | ![](capturas/figma-historico-carregando-escuro.png) |

## Diferenças encontradas

- **Barra lateral com erro (25:19177).** No frame, a área da Conversa segue em "Histórico
  carregando". Na web, a mesma falha do banco também impede a leitura da Conversa, e a área mostra o
  erro do histórico sem cabeçalho. Com só a lista em falha, a área segue normal.
- **Ajustes feitos na validação.** As linhas de esqueleto da barra lateral passaram a ter 8 px de
  altura, com 16 px entre elas e as larguras do frame. O botão do erro do histórico passou ao
  tamanho médio, e o esqueleto do nome no cabeçalho, a 20 px de altura.
- **Itens de outras funcionalidades:** os mesmos da validação da F02-T02 (o botão de Pessoas no
  cabeçalho, o botão de menções na caixa de mensagem, as seções e o trilho que ainda não existem).
