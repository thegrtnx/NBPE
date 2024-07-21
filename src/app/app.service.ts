import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as dayjs from 'dayjs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  private logsDir = path.join(__dirname, '..', '..', 'logs');

  constructor(private readonly configService: ConfigService) {}

  getHello(): string {
    // Read the server name from environment variables
    const serverName = this.configService.get<string>('PLATFORM_NAME');
    return serverName + ' server';
  }

  async getLogFiles(): Promise<string[]> {
    const files = await fs.readdir(this.logsDir);
    return files.filter((file) => file.endsWith('.log'));
  }

  async getLogFileContent(filename: string): Promise<object[]> {
    const filePath = path.join(this.logsDir, filename);
    const content = await fs.readFile(filePath, 'utf8');

    const jsonContent = content
      .split('\n')
      .filter((line) => line.trim() !== '')
      .map((line) => {
        const log = JSON.parse(line);
        log.timestamp = dayjs(log.timestamp).format(
          'ddd DD, MMMM YYYY - hh:mm:ssa',
        );

        // Remove statements starting from the word "in" in the trace if it exists
        if (log.trace) {
          const traceLines = log.trace.split('\n');
          log.trace = traceLines
            .filter((line) => !line.trim().startsWith('at'))
            .map((line) => line.replace(/\\/g, '')) // Remove all backslashes
            .join('\n');
        }

        return log;
      });
    return jsonContent;
  }

  async deleteLogFile(filename: string): Promise<void> {
    const filePath = path.join(this.logsDir, filename);
    await fs.unlink(filePath);
  }

  async deleteAllLogFiles(): Promise<void> {
    const files = await this.getLogFiles();
    for (const file of files) {
      await this.deleteLogFile(file);
    }
  }
}
