import { codePointLength } from '../common/validation/code-points';

export type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };

export const CHANNEL_NAME_MAX_LENGTH = 80;
export const TOPIC_MAX_LENGTH = 250;

// Letras minúsculas (inclusive acentuadas), letras sem caixa, marcas combinantes, dígitos, "-" e
// "_". Sem espaços, "#" nem maiúsculas.
const CHANNEL_NAME_PATTERN =
  /^[\p{Ll}\p{Lo}\p{Lm}\p{Nd}_-][\p{Ll}\p{Lo}\p{Lm}\p{M}\p{Nd}_-]*$/u;

// Regra do nome do Canal (spec da F02, "Comando de canais"), herdada pela F04.
export function parseChannelName(raw: string): Parsed<string> {
  const name = raw.trim().normalize('NFC');
  const length = codePointLength(name);
  if (length === 0 || length > CHANNEL_NAME_MAX_LENGTH) {
    return {
      ok: false,
      error: `O nome do canal precisa ter de 1 a ${CHANNEL_NAME_MAX_LENGTH} caracteres.`,
    };
  }
  if (!CHANNEL_NAME_PATTERN.test(name)) {
    return {
      ok: false,
      error:
        'O nome do canal só aceita letras minúsculas, dígitos, "-" e "_", sem espaços nem "#".',
    };
  }
  return { ok: true, value: name };
}

// Tópico opcional, numa linha só. Vazio vira Canal sem Tópico.
// Caracteres de controle (quebras de linha, tabulação, U+0000) e separadores de linha e de
// parágrafo: o Tópico é uma linha só, mostrada inteira no cabeçalho.
const TOPIC_FORBIDDEN = /[\p{Cc}\p{Zl}\p{Zp}]/u;

export function parseTopic(raw: string | undefined): Parsed<string | null> {
  // Confere o texto bruto: o trim tiraria uma quebra de linha das pontas sem avisar.
  if (TOPIC_FORBIDDEN.test(raw ?? '')) {
    return { ok: false, error: 'O tópico precisa caber numa linha só.' };
  }
  const topic = (raw ?? '').trim().normalize('NFC');
  if (topic === '') return { ok: true, value: null };
  if (codePointLength(topic) > TOPIC_MAX_LENGTH) {
    return {
      ok: false,
      error: `O tópico pode ter no máximo ${TOPIC_MAX_LENGTH} caracteres.`,
    };
  }
  return { ok: true, value: topic };
}
