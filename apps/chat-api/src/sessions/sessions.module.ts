import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoginAttemptsModule } from '../login-attempts/login-attempts.module';
import { PeopleModule } from '../people/people.module';
import { AuthGuard } from './auth.guard';
import { Session } from './session.entity';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Session]),
    PeopleModule,
    LoginAttemptsModule,
  ],
  controllers: [SessionsController],
  providers: [SessionsService, AuthGuard],
  exports: [SessionsService, AuthGuard],
})
export class SessionsModule {}
