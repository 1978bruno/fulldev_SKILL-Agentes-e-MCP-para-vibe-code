import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Person } from '../people/person.entity';
import { AuthGuard } from './auth.guard';
import { CurrentPerson } from './current-person.decorator';
import { LoginDto } from './login.dto';
import { PersonResponse, toPersonResponse } from './person.response';
import { SessionsService } from './sessions.service';

@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessions: SessionsService) {}

  @Post()
  async create(
    @Body() body: LoginDto,
  ): Promise<{ token: string; person: PersonResponse }> {
    const { token, person } = await this.sessions.login(
      body.email,
      body.password,
    );
    return { token, person: toPersonResponse(person) };
  }

  @Get('current')
  @UseGuards(AuthGuard)
  current(@CurrentPerson() person: Person): { person: PersonResponse } {
    return { person: toPersonResponse(person) };
  }
}
