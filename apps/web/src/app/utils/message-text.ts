// Tamanho máximo da Mensagem, em pontos de código, como a API e o banco (LLD, "Valores e
// configuração").
export const MESSAGE_MAX_LENGTH = 4000;

export function codePointLength(text: string): number {
  return Array.from(text).length;
}
