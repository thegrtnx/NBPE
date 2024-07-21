import { Controller, Post, Body, HttpCode, Patch, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  CreateAuthDto,
  VerifyAuthDto,
  ResetAuthDto,
  AuthDto,
} from './dto/auth.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Create An Account' })
  @Post('/signup')
  create(@Body() createAuthDto: CreateAuthDto) {
    return this.authService.create(createAuthDto);
  }

  @HttpCode(200)
  @ApiOperation({ summary: 'Verify Account' })
  @Post('/otp/verify')
  verifyUser(@Body() verifyUsr: VerifyAuthDto) {
    return this.authService.verifyUser(verifyUsr);
  }

  @ApiOperation({
    summary: 'Send Token/OTP Code',
    description:
      'Used for Resending OTP Code and can be used to send reset token for resetting password',
  })
  @Patch('/token/:identifier')
  sendToken(@Param('identifier') id: string) {
    return this.authService.sendToken(id);
  }

  @HttpCode(200)
  @ApiOperation({ summary: 'Update Password' })
  @Post('/update-password')
  UpdatePwd(@Body() updatePwd: ResetAuthDto) {
    return this.authService.updatePwd(updatePwd);
  }

  @HttpCode(200)
  @ApiOperation({ summary: 'Login to Account' })
  @Post('/signin')
  loginUser(@Body() loginAuthDto: AuthDto) {
    return this.authService.loginUser(loginAuthDto);
  }
}
