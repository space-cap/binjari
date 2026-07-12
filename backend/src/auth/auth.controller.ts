import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /v1/auth/kakao
   * 카카오 소셜 로그인 처리 엔드포인트
   */
  @Post('kakao')
  @HttpCode(HttpStatus.OK)
  async kakaoLogin(@Body('kakao_access_token') kakaoAccessToken: string) {
    const user = await this.authService.validateKakaoUser(kakaoAccessToken);
    return this.authService.login(user);
  }
}
