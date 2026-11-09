import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoginAttempt } from './login-attempt.entity';
import { LoginAttemptsService } from './login-attempts.service';

@Module({
  imports: [TypeOrmModule.forFeature([LoginAttempt])],
  providers: [LoginAttemptsService],
  exports: [LoginAttemptsService],
})
export class LoginAttemptsModule {}
