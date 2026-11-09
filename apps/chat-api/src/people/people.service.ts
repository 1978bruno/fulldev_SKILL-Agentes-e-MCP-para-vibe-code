import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
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

  findByEmail(email: string): Promise<Person | null> {
    return this.people.findOneBy({ email: normalizeEmail(email) });
  }

  findById(id: string): Promise<Person | null> {
    return this.people.findOneBy({ id });
  }
}
