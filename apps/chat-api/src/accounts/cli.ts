import { CONSOLE_OUTPUT, runCommand } from '../common/cli/command';
import { ConversationsService } from '../conversations/conversations.service';
import { PeopleService } from '../people/people.service';
import { SessionsService } from '../sessions/sessions.service';
import { AccountsCommand } from './accounts.command';
import { AccountsModule } from './accounts.module';
import { TtyPasswordPrompt } from './password-prompt';

runCommand(
  AccountsModule,
  (app) =>
    new AccountsCommand(
      app.get(PeopleService),
      app.get(ConversationsService),
      app.get(SessionsService),
      new TtyPasswordPrompt(),
      CONSOLE_OUTPUT,
    ),
);
