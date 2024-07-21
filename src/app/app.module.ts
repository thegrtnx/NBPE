import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from 'src/config/prisma/prisma.module';
import { SendMailsModule } from 'src/config/email/sendMail.module';
import { TelegramBotModule } from 'src/config/telegram_bot/telegramBot.module';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module';
import { CustomLogger } from 'src/logger/winston.logger';
import { AvatarModule } from 'src/config/avatars/avatar.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    PrismaModule,
    SendMailsModule,
    TelegramBotModule,
    AuthModule,
    UsersModule,
    AvatarModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    CustomLogger,
    {
      provide: APP_INTERCEPTOR,
      useClass: CustomLogger,
    },
  ],
})
export class AppModule {}
