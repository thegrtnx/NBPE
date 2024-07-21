import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from 'src/config/prisma/prisma.service';
import { UpdateUserDto, UpdatePasswordDto } from './dto/user.dto';
import { AuthHelper } from 'src/helpers';
import { handleResponse } from 'src/utils/responseHandler';
import * as argon from 'argon2';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authServiceHelper: AuthHelper,
  ) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { userid: userId },
    });

    if (!user) {
      throw new handleResponse(
        HttpStatus.UNAUTHORIZED,
        'User session not authorized',
      );
    }

    const sanitizedUser = this.authServiceHelper.sanitizeUser(user);

    return new handleResponse(
      HttpStatus.OK,
      'User found',
      sanitizedUser,
    ).getResponse();
  }

  async updateProfile(userId: string, updateProfileDto: UpdateUserDto) {
    const user = await this.authServiceHelper.validateUser(userId);

    if (!user || user.isActive !== true) {
      throw new handleResponse(
        HttpStatus.UNAUTHORIZED,
        'User Session Unauthorized',
      );
    }

    const user_detail = await this.prisma.user.update({
      where: { userid: userId },
      data: updateProfileDto,
    });

    const sanitizedUser = this.authServiceHelper.sanitizeUser(user_detail);

    return new handleResponse(
      HttpStatus.OK,
      'Profile updated successfully',
      sanitizedUser,
    ).getResponse();
  }

  async updatePassword(userId: string, updatePasswordDto: UpdatePasswordDto) {
    const user = await this.authServiceHelper.validateUser(userId);

    if (!user || user.isActive !== true) {
      throw new handleResponse(
        HttpStatus.UNAUTHORIZED,
        'User Session Unauthorized',
      );
    }

    const user_verify = await this.prisma.user.findUnique({
      where: { userid: userId },
    });

    const isPasswordValid = await argon.verify(
      user_verify.password,
      updatePasswordDto.currentPassword,
    );

    if (!isPasswordValid) {
      throw new handleResponse(
        HttpStatus.CONFLICT,
        'Current password is incorrect',
      );
    }

    if (updatePasswordDto.newPassword !== updatePasswordDto.confirmPassword) {
      throw new handleResponse(HttpStatus.CONFLICT, 'Passwords do not match');
    }

    const isOldPassword = await argon.verify(
      user_verify.password,
      updatePasswordDto.newPassword,
    );
    if (isOldPassword) {
      throw new handleResponse(
        HttpStatus.BAD_REQUEST,
        'Cannot use old password',
      );
    }

    const hashedPassword = await this.authServiceHelper.hashPassword(
      updatePasswordDto.newPassword,
    );

    await this.prisma.user.update({
      where: { userid: userId },
      data: { password: hashedPassword, confirm_password: hashedPassword },
    });

    return new handleResponse(
      HttpStatus.OK,
      'Password updated successfully',
    ).getResponse();
  }
}
