import { randomBytes } from 'node:crypto';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { hash, verify } from '@node-rs/argon2';

// Argon2id com os parâmetros padrão da biblioteca (m=19456, t=2, p=1: o mínimo da OWASP).
@Injectable()
export class PasswordHasher implements OnModuleInit {
  private dummyHash!: string;

  // Gerado na subida: gerar no primeiro e-mail sem conta faria essa resposta levar o dobro.
  async onModuleInit(): Promise<void> {
    this.dummyHash = await hash(randomBytes(32).toString('base64url'));
  }

  hash(password: string): Promise<string> {
    return hash(password);
  }

  verify(passwordHash: string, password: string): Promise<boolean> {
    return verify(passwordHash, password);
  }

  // Verifica contra um hash fictício, para o e-mail sem conta levar o mesmo tempo
  // que a senha errada (LLD, "Segurança").
  async verifyDummy(password: string): Promise<false> {
    await verify(this.dummyHash, password);
    return false;
  }
}
