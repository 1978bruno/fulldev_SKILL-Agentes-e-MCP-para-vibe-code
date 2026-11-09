import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, QueryFailedError, Repository } from 'typeorm';
import { EmailAlreadyExistsError } from './email-already-exists.error';
import { normalizeEmail } from './normalize-email';
import { PasswordHasher } from './password-hasher';
import { Person } from './person.entity';

export interface NewPerson {
  email: string;
  name: string;
  password: string;
}

function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof QueryFailedError &&
    (error.driverError as { code?: string } | undefined)?.code === '23505'
  );
}

@Injectable()
export class PeopleService {
  constructor(
    @InjectRepository(Person) private readonly people: Repository<Person>,
    private readonly passwords: PasswordHasher,
  ) {}

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
    return this.people.manager.transaction(async (manager) => {
      const locked = await manager.getRepository(Person).findOne({
        where: { id: person.id, passwordHash: person.passwordHash },
        lock: { mode: 'pessimistic_read' },
      });
      return locked ? work(manager) : null;
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
    return this.people.manager.transaction(async (manager) => {
      await manager
        .getRepository(Person)
        .update({ id: personId }, { passwordHash });
      return alsoInTransaction(manager);
    });
  }

  findByEmail(email: string): Promise<Person | null> {
    return this.people.findOneBy({ email: normalizeEmail(email) });
  }

  findById(id: string): Promise<Person | null> {
    return this.people.findOneBy({ id });
  }
}
