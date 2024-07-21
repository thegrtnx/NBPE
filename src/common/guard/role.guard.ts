import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from 'src/config/prisma/prisma.service';
import { ROLES_KEY } from '../decorator';
import { Role } from '../enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    const userFromDb = await this.prisma.user.findUnique({
      where: { userid: user.userid },
    });

    if (!userFromDb) {
      throw new UnauthorizedException();
    }

    return requiredRoles.some((role) => userFromDb.role === role);
  }
}
