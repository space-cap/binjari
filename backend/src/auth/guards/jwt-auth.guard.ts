import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // 부모 클래스의 기본 인증 로직 수행
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    // 인증 실패 시 예외 처리 커스터마이징
    if (err || !user) {
      throw err || new UnauthorizedException('인증 토큰이 누락되었거나 만료되었습니다.');
    }
    return user;
  }
}
