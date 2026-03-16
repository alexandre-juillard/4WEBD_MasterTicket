import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { JwtPayload, UserRole } from '../interfaces/jwt-payload.interface';

const rolePriority: Record<UserRole, number> = {
  [UserRole.Admin]: 4,
  [UserRole.EventCreator]: 3,
  [UserRole.Operator]: 2,
  [UserRole.User]: 1,
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload | undefined;

    if (!user) {
      throw new UnauthorizedException('Missing authenticated user');
    }

    const userRank = rolePriority[user.role] ?? 0;
    return requiredRoles.some((role) => userRank >= rolePriority[role]);
  }
}
