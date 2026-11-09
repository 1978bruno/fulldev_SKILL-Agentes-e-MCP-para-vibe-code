import { randomBytes } from 'node:crypto';

// UUID v7 com o instante pedido nos 48 bits do tempo, para montar históricos com datas
// conhecidas na ordem certa. Instantes iguais não têm ordem garantida.
export function uuidV7At(milliseconds: number): string {
  const bytes = randomBytes(16);
  let time = BigInt(milliseconds);
  for (let index = 5; index >= 0; index -= 1) {
    bytes[index] = Number(time & 0xffn);
    time >>= 8n;
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x70;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
