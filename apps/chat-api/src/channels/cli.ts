import { CONSOLE_OUTPUT, runCommand } from '../common/cli/command';
import { ConversationsService } from '../conversations/conversations.service';
import { ChannelsCommand } from './channels.command';
import { ChannelsModule } from './channels.module';

runCommand(
  ChannelsModule,
  (app) => new ChannelsCommand(app.get(ConversationsService), CONSOLE_OUTPUT),
);
