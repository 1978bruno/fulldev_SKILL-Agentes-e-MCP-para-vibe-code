// Marca, nesta aba, que a Pessoa pediu para sair. O sair encerra a Sessão e a API avisa todas as
// abas dela pelo tempo real, inclusive esta; aqui quem leva a "Entrar" é o próprio sair, e o aviso
// é ignorado para não disputar a navegação.
let isLeaving = false;

export function markLeaving(): void {
  isLeaving = true;
}

export function hasAskedToLeave(): boolean {
  return isLeaving;
}
