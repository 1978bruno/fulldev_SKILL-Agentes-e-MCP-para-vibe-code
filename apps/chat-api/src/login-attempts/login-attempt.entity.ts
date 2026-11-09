import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../database/base.entity';

// Uma linha por e-mail normalizado com falhas na janela (LLD, "Limite de tentativas").
@Entity('login_attempts')
export class LoginAttempt extends BaseEntity {
  @Column({ type: 'text', unique: true })
  email!: string;

  @Column({ type: 'integer' })
  failedCount!: number;

  @Column({ type: 'timestamptz' })
  firstFailedAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  blockedUntil!: Date | null;
}
