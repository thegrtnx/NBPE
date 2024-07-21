import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UpdateUserDto, UpdatePasswordDto } from './dto/user.dto';
import { GetUser } from 'src/common/decorator';
import { JwtGuard } from 'src/common/guard';
import { User } from '@prisma/client';

@UseGuards(JwtGuard)
@ApiBearerAuth('Authorization')
@ApiTags('Users')
@Controller('user')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'View current logged-in user profile' })
  @Get('/profile')
  async findOne(@GetUser() user: User) {
    return this.usersService.getProfile(user.userid);
  }

  @ApiOperation({
    summary: 'Update current logged-in user profile (excluding password)',
  })
  @Put('/profile')
  updateProfile(
    @GetUser() user: User,
    @Body() updateProfileDto: UpdateUserDto,
  ) {
    return this.usersService.updateProfile(user.userid, updateProfileDto);
  }

  @ApiOperation({ summary: 'Update current logged-in user password securely' })
  @Put('/profile/password')
  updatePassword(
    @GetUser() user: User,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ) {
    return this.usersService.updatePassword(user.email, updatePasswordDto);
  }
}
