// Marca, nesta aba, que a Pessoa pediu para sair. O sair encerra a Sessão e a API avisa todas as
// abas dela pelo tempo real, inclusive esta; aqui quem leva a "Entrar" é o próprio sair, e o aviso
// é ignorado para não disputar a navegação. A marca vale para a conexão em que a Pessoa saiu: a
// conexão seguinte, depois de entrar de novo, a limpa.
let isLeaving = false;

export function markLeaving(): void {
  isLeaving = true;
}

export function clearLeaving(): void {
  isLeaving = false;
}

export function hasAskedToLeave(): boolean {
  return isLeaving;
}
