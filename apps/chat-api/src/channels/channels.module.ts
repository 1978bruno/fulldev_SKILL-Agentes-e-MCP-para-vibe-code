import { Module } from '@nestjs/common';
import { AppConfigModule } from '../config/config.module';
import { ConversationsModule } from '../conversations/conversations.module';
import { DatabaseModule } from '../database/database.module';

// Contexto do comando de canais: sobe o Nest sem HTTP, com o service de Conversas.
@Module({
  imports: [AppConfigModule, DatabaseModule, ConversationsModule],
})
export class ChannelsModule {}
