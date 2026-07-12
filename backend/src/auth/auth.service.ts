import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { JwtService } from '@nestjs/jwt';
import { firstValueFrom } from 'rxjs';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { EmailLoginDto } from './dto/email-login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly httpService: HttpService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * 일반 이메일 회원가입
   */
  async register(dto: RegisterDto): Promise<User> {
    // 1. 이메일 중복 검사
    const existingUser = await this.userRepository.findOne({ where: { email: dto.email } });
    if (existingUser) {
      throw new ConflictException('이미 사용 중인 이메일 주소입니다.');
    }

    // 2. 패스워드 솔트 해싱
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // 3. 사용자 생성 및 저장
    const user = this.userRepository.create({
      email: dto.email,
      name: dto.name,
      password: hashedPassword,
      role: dto.role ?? UserRole.GUEST,
    });

    const savedUser = await this.userRepository.save(user);
    
    // 보안을 위해 반환 객체에서 패스워드 제거
    delete savedUser.password;
    return savedUser;
  }

  /**
   * 일반 이메일 로그인 검증
   */
  async validateEmailUser(dto: EmailLoginDto): Promise<User> {
    // password 필드는 select: false 설정이 되어 있으므로 강제 로드
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email: dto.email })
      .getOne();

    if (!user || !user.password) {
      throw new UnauthorizedException('이메일 주소 또는 비밀번호를 다시 확인해 주세요.');
    }

    // 비밀번호 매칭 확인
    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('이메일 주소 또는 비밀번호를 다시 확인해 주세요.');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('비활성화된 회원 계정입니다. 관리자에게 문의해 주세요.');
    }

    // 반환 시 패스워드 제거
    delete user.password;
    return user;
  }

  /**
   * 카카오 액세스 토큰으로 사용자 정보를 검증하고 로그인/회원가입 처리
   */
  async validateKakaoUser(kakaoAccessToken: string): Promise<User> {
    try {
      // 카카오 프로필 API 호출
      const response = await firstValueFrom(
        this.httpService.get('https://kapi.kakao.com/v2/user/me', {
          headers: {
            Authorization: `Bearer ${kakaoAccessToken}`,
          },
        }),
      );

      const kakaoUser = response.data;
      const kakaoId = String(kakaoUser.id);
      const email = kakaoUser.kakao_account?.email || `${kakaoId}@binjari.kakao.com`; // 이메일이 없는 경우 가상 이메일 생성
      const name = kakaoUser.properties?.nickname || '카카오 사용자';
      const profileImage = kakaoUser.properties?.profile_image || null;

      // 1. 기존 유저가 있는지 카카오 ID로 조회
      let user = await this.userRepository.findOne({ where: { kakaoId } });

      if (!user) {
        // 이메일 중복 체크 (소셜 계정이 다른 경우 대비)
        const existingEmailUser = await this.userRepository.findOne({ where: { email } });
        if (existingEmailUser) {
          // 이메일이 중복되면 해당 계정에 카카오 ID 연동
          existingEmailUser.kakaoId = kakaoId;
          if (!existingEmailUser.profileImage) {
            existingEmailUser.profileImage = profileImage;
          }
          user = await this.userRepository.save(existingEmailUser);
        } else {
          // 신규 가입 처리
          user = this.userRepository.create({
            kakaoId,
            email,
            name,
            profileImage,
            role: UserRole.GUEST,
          });
          user = await this.userRepository.save(user);
        }
      }

      return user;
    } catch (error) {
      throw new UnauthorizedException('카카오 토큰 검증에 실패했습니다.');
    }
  }

  /**
   * 검증된 사용자 정보를 바탕으로 JWT 발급
   */
  async login(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        profile_image: user.profileImage,
        role: user.role,
      },
    };
  }
}
