import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class TelegramService {
  private readonly token: string;
  private readonly apiUrl: string;

  constructor(private configService: ConfigService) {
    this.token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    this.apiUrl = `https://api.telegram.org/bot${this.token}`;
  }

  async sendMessage(chatId: string, message: string): Promise<void> {
    const url = `${this.apiUrl}/sendMessage`;
    const payload = {
      chat_id: chatId,
      text: message,
    };

    try {
      await axios.post(url, payload);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }
}
