import { Module } from '@nestjs/common';
import { AppConfigModule } from '../config/config.module';
import { DatabaseModule } from '../database/database.module';
import { PeopleModule } from '../people/people.module';
import { SessionsModule } from '../sessions/sessions.module';

// Contexto do comando de contas: sobe o Nest sem HTTP, com os services de Pessoas e Sessões.
@Module({
  imports: [AppConfigModule, DatabaseModule, PeopleModule, SessionsModule],
})
export class AccountsModule {}
