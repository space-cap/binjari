import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
   * @CurrentUser() 데코레이터
   * 컨트롤러의 파라미터에서 현재 로그인된 유저 객체(req.user)를 손쉽게 추출합니다.
   */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
