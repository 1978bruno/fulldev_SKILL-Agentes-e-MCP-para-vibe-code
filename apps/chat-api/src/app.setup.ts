import { INestApplication } from '@nestjs/common';
import { ChatIoAdapter } from './realtime/chat-io.adapter';

export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix('v1');
  app.useWebSocketAdapter(new ChatIoAdapter(app));
}
