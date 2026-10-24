import { createParamDecorator, type ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';

/**
 * 리버스 프록시(nginx + Authelia)가 인증 후 Remote-User 헤더로 넘겨주는 사용자 이름.
 * 프록시가 클라이언트가 보낸 같은 헤더를 덮어쓰므로, API 는 프록시를 거쳐서만 접근할 수 있어야 한다.
 * 헤더가 없으면 프록시를 거치지 않은 요청으로 보고 401 을 돌려준다.
 *
 * @example
 * ```ts
 * @Get('connections')
 * list(@RemoteUser() userId: string) {}
 * ```
 */
export const RemoteUser = createParamDecorator((_data: unknown, context: ExecutionContext): string => {
  const user = context.switchToHttp().getRequest<Request>().header('remote-user')?.trim();
  if (!user) {
    throw new UnauthorizedException('Remote-User 헤더가 없습니다.');
  }
  return user;
});
