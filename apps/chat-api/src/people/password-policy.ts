// Teto da senha: o login recusa acima dele (para um texto enorme não pesar no Argon2id), e o
// comando de contas não grava uma senha que nunca conseguiria entrar.
export const PASSWORD_MAX_LENGTH = 256;
