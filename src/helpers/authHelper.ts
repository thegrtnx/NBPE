import { Injectable } from '@nestjs/common';
import * as argon from 'argon2';
import { PrismaService } from 'src/config/prisma/prisma.service';

@Injectable()
export class AuthHelper {
  constructor(private readonly prisma: PrismaService) {}

  async hashPassword(password: string) {
    return await argon.hash(password);
  }

  async generateOTP(length: number = 4) {
    return Array.from({ length }, () =>
      Math.random().toString(36).charAt(2),
    ).join('');
  }

  async fetchUserByIdentifier(identifier: string) {
    const searchCriteria = {
      OR: [
        { email: identifier },
        { telephone: identifier },
        { username: identifier },
        { userid: identifier },
      ],
    };
    return await this.prisma.user.findFirst({ where: searchCriteria });
  }

  async updateUser(
    id: any,
    data: Partial<{
      otp: string;
      isVerified: boolean;
      isActive: boolean;
      otpExpiry: Date;
      password: string;
      confirm_password: string;
    }>,
  ) {
    return await this.prisma.user.update({
      where: { userid: id },
      data,
    });
  }

  async validateUser(userId: string) {
    return await this.prisma.user.findUnique({
      where: { userid: userId },
    });
  }

  sanitizeUser(user: any) {
    const sanitizedUser = { ...user };
    delete sanitizedUser.password;
    delete sanitizedUser.confirm_password;
    delete sanitizedUser.otp;
    delete sanitizedUser.otpExpiry;
    delete sanitizedUser.fingerprint;
    delete sanitizedUser.resetToken;
    delete sanitizedUser.resetTokenExpiry;
    delete sanitizedUser.isActive;
    delete sanitizedUser.isVerified;
    delete sanitizedUser.lastLogin;
    return sanitizedUser;
  }
}
