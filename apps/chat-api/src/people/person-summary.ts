import { compareNames } from '../conversations/name-order';

// Uma Pessoa nas listas por nome (Membros, busca), sem o e-mail.
export interface PersonSummary {
  id: string;
  name: string;
}

// As Pessoas na ordem alfabética da aplicação ("name-order.ts").
export function sortedSummaries(people: PersonSummary[]): PersonSummary[] {
  return people
    .map(({ id, name }) => ({ id, name }))
    .sort((a, b) => compareNames(a.name, b.name));
}
