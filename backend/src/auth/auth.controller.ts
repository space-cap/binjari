import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { EmailLoginDto } from './dto/email-login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /v1/auth/register
   * 일반 이메일 회원가입
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  /**
   * POST /v1/auth/email-login
   * 일반 이메일 로그인
   */
  @Post('email-login')
  @HttpCode(HttpStatus.OK)
  async emailLogin(@Body() emailLoginDto: EmailLoginDto) {
    const user = await this.authService.validateEmailUser(emailLoginDto);
    return this.authService.login(user);
  }

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
