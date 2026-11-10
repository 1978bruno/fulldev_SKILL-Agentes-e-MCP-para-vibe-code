import { Propagation, TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import { Injectable } from '@nestjs/common';
import { EntityManager, In, Repository } from 'typeorm';
import { isUniqueViolation } from '../database/unique-violation';
import { EmailAlreadyExistsError } from './email-already-exists.error';
import { normalizeEmail } from './normalize-email';
import { PasswordHasher } from './password-hasher';
import { Person } from './person.entity';

export interface NewPerson {
  email: string;
  name: string;
  password: string;
}

@Injectable()
export class PeopleService {
  constructor(
    private readonly txHost: TransactionHost<TransactionalAdapterTypeOrm>,
    private readonly passwords: PasswordHasher,
  ) {}

  // Pelo TransactionHost, para participar da transação de quem orquestra, quando há uma.
  private get people(): Repository<Person> {
    return this.txHost.tx.getRepository(Person);
  }

  async create({ email, name, password }: NewPerson): Promise<Person> {
    const normalized = normalizeEmail(email);
    if (await this.people.existsBy({ email: normalized })) {
      throw new EmailAlreadyExistsError(normalized);
    }
    const person = this.people.create({
      email: normalized,
      name: name.trim(),
      passwordHash: await this.passwords.hash(password),
    });
    try {
      return await this.people.save(person);
    } catch (error) {
      // Duas criações simultâneas passam pelo existsBy; o índice único decide.
      if (isUniqueViolation(error)) {
        throw new EmailAlreadyExistsError(normalized);
      }
      throw error;
    }
  }

  // Devolve a Pessoa só quando a senha confere. O e-mail sem conta passa pelo hash
  // fictício, para o tempo de resposta não revelar se a conta existe.
  async verifyCredentials(
    email: string,
    password: string,
  ): Promise<Person | null> {
    const person = await this.findByEmail(email);
    if (!person) {
      await this.passwords.verifyDummy(password);
      return null;
    }
    const isValid = await this.passwords.verify(person.passwordHash, password);
    return isValid ? person : null;
  }

  // Roda `work` numa transação com a linha da Pessoa travada (FOR SHARE), só se o hash da senha
  // ainda for o que o login conferiu; devolve null se a senha mudou. Uma troca de senha ao mesmo
  // tempo faz a trava esperar e reavaliar o hash, e a troca que começa depois espera `work`
  // terminar, para a revogação que vem em seguida alcançar o que ele gravou.
  async withPasswordUnchanged<T>(
    person: Person,
    work: (manager: EntityManager) => Promise<T>,
  ): Promise<T | null> {
    return this.txHost.withTransaction(Propagation.RequiresNew, async () => {
      const locked = await this.people.findOne({
        where: { id: person.id, passwordHash: person.passwordHash },
        lock: { mode: 'pessimistic_read' },
      });
      return locked ? work(this.txHost.tx) : null;
    });
  }

  // Troca o hash e roda `alsoInTransaction` (a revogação das Sessões, no reset-password) na
  // mesma transação: ou as duas escritas valem, ou nenhuma. O hash é calculado antes, para o
  // Argon2id não segurar a trava da linha.
  async changePassword<T>(
    personId: string,
    password: string,
    alsoInTransaction: (manager: EntityManager) => Promise<T>,
  ): Promise<T> {
    const passwordHash = await this.passwords.hash(password);
    return this.txHost.withTransaction(Propagation.RequiresNew, async () => {
      await this.people.update({ id: personId }, { passwordHash });
      return alsoInTransaction(this.txHost.tx);
    });
  }

  findByEmail(email: string): Promise<Person | null> {
    return this.people.findOneBy({ email: normalizeEmail(email) });
  }

  findById(id: string): Promise<Person | null> {
    return this.people.findOneBy({ id });
  }

  findByIds(ids: string[]): Promise<Person[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return this.people.findBy({ id: In(ids) });
  }

  // Busca pelo nome, sem diferenciar maiúsculas, minúsculas e acentos, deixando de fora as Pessoas
  // de `excludeIds` (spec da F04, "Busca de Pessoas"). O banco filtra e corta em `limit`, pela
  // ordem do nome sem acento; quem chama reordena pela regra da aplicação.
  search(q: string, excludeIds: string[], limit: number): Promise<Person[]> {
    // %, _ e \ do texto valem como literais no LIKE.
    const pattern = `%${q.replace(/[\\%_]/g, '\\$&')}%`;
    return this.people
      .createQueryBuilder('person')
      .where(
        "unaccent(lower(person.name)) LIKE unaccent(lower(:pattern)) ESCAPE '\\'",
        { pattern },
      )
      .andWhere('NOT (person.id = ANY(:excludeIds))', { excludeIds })
      .orderBy('unaccent(lower(person.name))', 'ASC')
      .limit(limit)
      .getMany();
  }

  // Todas as Pessoas do workspace, para a participação em Canal público (ADR 0024).
  async listIds(): Promise<string[]> {
    const people = await this.people.find({ select: { id: true } });
    return people.map((person) => person.id);
  }
}
