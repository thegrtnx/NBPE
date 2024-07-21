import { Injectable, HttpStatus } from '@nestjs/common';
import {
  CreateAuthDto,
  VerifyAuthDto,
  ResetAuthDto,
  AuthDto,
} from './dto/auth.dto';
import { PrismaService } from 'src/config/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { AuthHelper } from 'src/helpers';
import { SendMailsService } from 'src/config/email/sendMail.service';
import { handleResponse } from 'src/utils/responseHandler';
import { AvatarService } from 'src/config/avatars/avatar.service';
import { signToken } from 'src/helpers/jwtHelper';
import * as argon from 'argon2';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private readonly sendMail: SendMailsService,
    private readonly authServiceHelper: AuthHelper,
    private configservice: ConfigService,
    private readonly avatar: AvatarService,
  ) {}

  //create a new user account
  async create(createAuthDto: CreateAuthDto) {
    const avatarUrl = await this.avatar.getRandomAvatar();

    if (createAuthDto.password !== createAuthDto.confirm_password) {
      throw new handleResponse(HttpStatus.CONFLICT, 'Passwords do not match');
    }

    const hashedPassword = await this.authServiceHelper.hashPassword(
      createAuthDto.password,
    );
    const otpCode = await this.authServiceHelper.generateOTP();
    const otpExpiration = new Date();
    otpExpiration.setMinutes(otpExpiration.getMinutes() + 10);

    const user = await this.prisma.user.create({
      data: {
        ...createAuthDto,
        password: hashedPassword,
        confirm_password: hashedPassword,
        otp: await argon.hash(otpCode),
        otpExpiry: otpExpiration,
        profilePicture: avatarUrl,
      },
    });

    if (!user) {
      throw new handleResponse(HttpStatus.FORBIDDEN, 'Email already exists');
    }

    const to = { name: user.firstname, address: user.email };
    const subject = 'Activate Your Account';
    const template = 'activateAccount';
    const context = {
      name: `${user.firstname} ${user.lastname}`,
      otpCode,
      platform: this.configservice.get<string>('PLATFORM_NAME'),
      platformMail: this.configservice.get<string>('PLATFORM_SUPPORT'),
    };

    await this.sendMail.sendEmail(to, subject, template, context);

    const sanitizedUser = this.authServiceHelper.sanitizeUser(user);

    return new handleResponse(
      HttpStatus.CREATED,
      'User Created Successfully',
      sanitizedUser,
    ).getResponse();
  }

  //verify a new user account
  async verifyUser(verifyAuthDto: VerifyAuthDto) {
    const user = await this.authServiceHelper.fetchUserByIdentifier(
      verifyAuthDto.identifier,
    );

    if (!user) {
      throw new handleResponse(HttpStatus.NOT_FOUND, 'Account not found');
    }

    if (!user.otp || !user.otpExpiry) {
      throw new handleResponse(HttpStatus.NOT_FOUND, 'OTP has been used');
    }

    if (new Date() > user.otpExpiry) {
      throw new handleResponse(HttpStatus.FORBIDDEN, 'OTP has expired');
    }

    const isOtpValid = await argon.verify(user.otp, verifyAuthDto.otp);
    if (!isOtpValid) {
      throw new handleResponse(HttpStatus.BAD_REQUEST, 'Invalid OTP');
    }

    await this.authServiceHelper.updateUser(user.userid, {
      otp: null,
      isVerified: true,
      isActive: true,
      otpExpiry: null,
    });

    const to = { name: user.firstname, address: user.email };
    const subject = `Welcome to ${this.configservice.get<string>('PLATFORM_NAME')}`;
    const template = 'welcomeMessage';
    const context = {
      name: `${user.firstname} ${user.lastname}`,
      platform: this.configservice.get<string>('PLATFORM_NAME'),
      platformMail: this.configservice.get<string>('PLATFORM_SUPPORT'),
    };

    await this.sendMail.sendEmail(to, subject, template, context);

    const sanitizedUser = this.authServiceHelper.sanitizeUser(user);

    const token = await signToken(
      user.userid,
      user.email,
      user.username,
      user.telephone,
      this.configservice,
    );

    return new handleResponse(HttpStatus.OK, 'Account Successfully Verified', {
      user: sanitizedUser,
      token,
    }).getResponse();
  }

  //resend otp code to a user
  async sendToken(id: string) {
    const otpCode = await this.authServiceHelper.generateOTP();
    const otpExpiration = new Date();
    otpExpiration.setMinutes(otpExpiration.getMinutes() + 10);

    const user = await this.authServiceHelper.fetchUserByIdentifier(id);

    if (!user) {
      throw new handleResponse(HttpStatus.NOT_FOUND, 'Account not found');
    }

    await this.authServiceHelper.updateUser(user.userid, {
      otp: await argon.hash(otpCode),
      otpExpiry: otpExpiration,
    });

    const to = { name: user.firstname, address: user.email };
    const subject = 'New Token Received';
    const template = 'resendOtporToken';
    const context = {
      name: `${user.firstname} ${user.lastname}`,
      otpCode,
      platform: this.configservice.get<string>('PLATFORM_NAME'),
      platformMail: this.configservice.get<string>('PLATFORM_SUPPORT'),
    };

    await this.sendMail.sendEmail(to, subject, template, context);

    return new handleResponse(HttpStatus.OK, 'Token Code Sent').getResponse();
  }

  async updatePwd(updatePwd: ResetAuthDto) {
    if (updatePwd.password !== updatePwd.confirm_password) {
      throw new handleResponse(HttpStatus.CONFLICT, 'Passwords do not match');
    }

    const hashedPassword = await this.authServiceHelper.hashPassword(
      updatePwd.password,
    );

    const user = await this.authServiceHelper.fetchUserByIdentifier(
      updatePwd.identifier,
    );

    if (!user) {
      throw new handleResponse(HttpStatus.NOT_FOUND, 'Account not found');
    }

    if (!user.otp || !user.otpExpiry) {
      throw new handleResponse(
        HttpStatus.NOT_FOUND,
        'Reset Token has been used',
      );
    }

    if (new Date() > user.otpExpiry) {
      throw new handleResponse(HttpStatus.FORBIDDEN, 'Reset Token has expired');
    }

    const isOtpValid = await argon.verify(user.otp, updatePwd.otp);
    if (!isOtpValid) {
      throw new handleResponse(HttpStatus.BAD_REQUEST, 'Invalid OTP');
    }

    const isOldPassword = await argon.verify(user.password, updatePwd.password);
    if (isOldPassword) {
      throw new handleResponse(
        HttpStatus.BAD_REQUEST,
        'Cannot use old password',
      );
    }

    await this.authServiceHelper.updateUser(user.userid, {
      password: hashedPassword,
      confirm_password: hashedPassword,
      otp: null,
      otpExpiry: null,
    });

    const to = { name: user.firstname, address: user.email };
    const subject = 'Password Updated';
    const template = 'passwordUpdated';
    const context = {
      name: `${user.firstname} ${user.lastname}`,
      platform: this.configservice.get<string>('PLATFORM_NAME'),
      platformMail: this.configservice.get<string>('PLATFORM_SUPPORT'),
    };

    await this.sendMail.sendEmail(to, subject, template, context);

    return new handleResponse(HttpStatus.OK, 'Password Updated').getResponse();
  }

  async loginUser(loginAuthDto: AuthDto) {
    const user = await this.authServiceHelper.fetchUserByIdentifier(
      loginAuthDto.identifier,
    );

    if (!user) {
      throw new handleResponse(HttpStatus.NOT_FOUND, 'Account not found');
    }

    const pwMatches = await argon.verify(user.password, loginAuthDto.password);

    if (!pwMatches) {
      throw new handleResponse(HttpStatus.FORBIDDEN, 'Password incorrect');
    }

    if (user.isVerified === false) {
      const otpCode = await this.authServiceHelper.generateOTP();
      const otpExpiration = new Date();
      otpExpiration.setMinutes(otpExpiration.getMinutes() + 10);

      await this.authServiceHelper.updateUser(user.userid, {
        otp: await argon.hash(otpCode),
        otpExpiry: otpExpiration,
      });

      const to = { name: user.firstname, address: user.email };
      const subject = 'Activate Your Account';
      const template = 'activateAccount';
      const context = {
        name: `${user.firstname} ${user.lastname}`,
        otpCode,
        platform: this.configservice.get<string>('PLATFORM_NAME'),
        platformMail: this.configservice.get<string>('PLATFORM_SUPPORT'),
      };

      await this.sendMail.sendEmail(to, subject, template, context);

      throw new handleResponse(
        HttpStatus.FORBIDDEN,
        'Account Not Verified - OTP sent to email',
      );
    }

    const currentDate = new Date();
    await this.prisma.user.update({
      where: { userid: user.userid },
      data: { lastLogin: currentDate, isActive: true },
    });

    const sanitizedUser = this.authServiceHelper.sanitizeUser(user);

    const token = await signToken(
      user.userid,
      user.email,
      user.username,
      user.telephone,
      this.configservice,
    );

    return new handleResponse(HttpStatus.OK, 'User Logged in', {
      user: sanitizedUser,
      token,
    }).getResponse();
  }
}
