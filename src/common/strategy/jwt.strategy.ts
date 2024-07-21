import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from 'src/config/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'securitysecured') {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get<string>('SECRET_KEY'),
    });
  }

  async validate(payload: {
    sub: string;
    email: string;
    username: string;
    telephone: string;
  }) {
    const user = await this.prisma.user.findUnique({
      where: {
        userid: payload.sub,
      },
    });

    delete user.password;
    delete user.confirm_password;
    delete user.otp;
    delete user.otpExpiry;
    delete user.fingerprint;

    return user;
  }
}
