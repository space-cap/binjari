import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { SpacesService } from './spaces.service';
import { CreateSpaceDto } from './dto/create-space.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('spaces')
export class SpacesController {
  constructor(private readonly spacesService: SpacesService) {}

  /**
   * 신규 오피스 공간 등록 (로그인 회원 전용)
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @CurrentUser() user: User,
    @Body() createSpaceDto: CreateSpaceDto,
  ) {
    return this.spacesService.createSpace(user.id, createSpaceDto);
  }

  /**
   * 공간 목록 조회
   */
  @Get()
  async findAll() {
    return this.spacesService.findAll();
  }
}
