import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AuthHelper } from 'src/helpers';

@Module({
  controllers: [UsersController],
  providers: [UsersService, AuthHelper],
})
export class UsersModule {}
