import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class AvatarService {
  async getRandomAvatar(): Promise<string> {
    const seed = Math.random().toString(36).substring(7); // Generate a random seed
    const response = await axios.get(
      `https://api.dicebear.com/9.x/open-peeps/svg?seed=${seed}`,
    );
    return response.config.url; // Return the URL of the generated avatar
  }
}
