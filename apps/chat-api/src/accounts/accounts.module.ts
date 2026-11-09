import { Module } from '@nestjs/common';
import { AppConfigModule } from '../config/config.module';
import { ConversationsModule } from '../conversations/conversations.module';
import { DatabaseModule } from '../database/database.module';
import { PeopleModule } from '../people/people.module';
import { SessionsModule } from '../sessions/sessions.module';

// Contexto do comando de contas: sobe o Nest sem HTTP, com os services de Pessoas, Conversas (a
// conta nova entra nos Canais públicos) e Sessões.
@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    PeopleModule,
    ConversationsModule,
    SessionsModule,
  ],
})
export class AccountsModule {}
