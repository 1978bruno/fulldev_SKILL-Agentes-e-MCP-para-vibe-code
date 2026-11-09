import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PasswordHasher } from './password-hasher';
import { PeopleService } from './people.service';
import { Person } from './person.entity';

@Module({
  // Registra a entidade no autoLoadEntities; o service usa o TransactionHost, e não este
  // repositório.
  imports: [TypeOrmModule.forFeature([Person])],
  providers: [PeopleService, PasswordHasher],
  exports: [PeopleService],
})
export class PeopleModule {}
