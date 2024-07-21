import { Controller, Delete, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AppService } from './app.service';
import { JwtGuard, RolesGuard } from 'src/common/guard';
import { Roles } from 'src/common/decorator';
import { Role } from 'src/common/enum';

@ApiTags('Server')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @ApiOperation({ summary: 'test server connection' })
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @ApiOperation({ summary: 'view all log files' })
  @Get('logs')
  getLogFiles() {
    return this.appService.getLogFiles();
  }

  @ApiOperation({ summary: 'get logs from a specific file' })
  @Get('logs/:filename')
  getLogFileContent(@Param('filename') filename: string) {
    return this.appService.getLogFileContent(filename);
  }

  @Delete('logs/:filename')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('Authorization')
  @ApiOperation({ summary: 'delete a specific log file' })
  deleteLogFile(@Param('filename') filename: string) {
    return this.appService.deleteLogFile(filename);
  }

  @Delete('logs')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('Authorization')
  @ApiOperation({ summary: 'delete all logs' })
  deleteAllLogFiles() {
    return this.appService.deleteAllLogFiles();
  }
}
