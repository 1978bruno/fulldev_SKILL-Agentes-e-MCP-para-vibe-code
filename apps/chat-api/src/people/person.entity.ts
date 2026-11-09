import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../database/base.entity';

@Entity('people')
export class Person extends BaseEntity {
  @Column({ type: 'text', unique: true })
  email!: string;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text' })
  passwordHash!: string;
}
