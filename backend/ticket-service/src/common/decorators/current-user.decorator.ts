import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest();
    const authorizationHeader = request.headers.authorization as string | undefined;
    const token = authorizationHeader?.replace('Bearer ', '');
    return { ...(request.user as JwtPayload), token };
  },
);
