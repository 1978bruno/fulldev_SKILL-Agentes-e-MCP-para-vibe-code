import { codePointLength } from "./message-text";

// Espelho, na web, da regra do nome e do Tópico do Canal da API do chat (spec da F02, "Comando de
// canais"; spec da F04, "Telas", diálogo "Criar canal"). A API continua dona da regra.
export const CHANNEL_NAME_MAX_LENGTH = 80;
export const TOPIC_MAX_LENGTH = 250;

const CHANNEL_NAME_PATTERN = /^[\p{Ll}\p{Lo}\p{Lm}\p{Nd}_-][\p{Ll}\p{Lo}\p{Lm}\p{M}\p{Nd}_-]*$/u;
// O que o nome aceita depois da primeira letra; o resto não entra.
const CHANNEL_NAME_CHARACTER = /[\p{Ll}\p{Lo}\p{Lm}\p{M}\p{Nd}_-]/u;
const LEADING_MARKS = /^\p{M}+/u;
const TOPIC_FORBIDDEN = /[\p{Cc}\p{Zl}\p{Zp}]/gu;

function truncateCodePoints(text: string, max: number): string {
  return Array.from(text).slice(0, max).join("");
}

// O nome enquanto a Pessoa digita: NFC, minúsculas, espaço vira "-", o que a regra não aceita não
// entra, e o texto para no limite.
export function normalizeChannelNameInput(text: string): string {
  const characters = Array.from(text.normalize("NFC").toLocaleLowerCase("pt-BR").replace(/\s/gu, "-"));
  const kept = characters.filter((character) => CHANNEL_NAME_CHARACTER.test(character)).join("");
  return truncateCodePoints(kept.replace(LEADING_MARKS, "").normalize("NFC"), CHANNEL_NAME_MAX_LENGTH);
}

export function isValidChannelName(name: string): boolean {
  const length = codePointLength(name);
  return length >= 1 && length <= CHANNEL_NAME_MAX_LENGTH && CHANNEL_NAME_PATTERN.test(name);
}

// O Tópico enquanto a Pessoa digita ou cola: numa linha só e até o limite.
export function normalizeTopicInput(text: string): string {
  return truncateCodePoints(text.replace(TOPIC_FORBIDDEN, " "), TOPIC_MAX_LENGTH);
}

export function isValidTopic(topic: string): boolean {
  return !/[\p{Cc}\p{Zl}\p{Zp}]/u.test(topic) && codePointLength(topic.trim()) <= TOPIC_MAX_LENGTH;
}
