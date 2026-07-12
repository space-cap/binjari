import { Controller, Post, Get, Body, UseGuards, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { SpacesService } from './spaces.service';
import { CreateSpaceDto } from './dto/create-space.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { multerOptions } from './helpers/upload.helper';

@Controller('spaces')
export class SpacesController {
  constructor(private readonly spacesService: SpacesService) {}

  /**
   * 공간 이미지 다중 파일 업로드 (최대 10장)
   */
  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('files', 10, multerOptions))
  async uploadImages(@UploadedFiles() files: any[]) {
    const urls = files.map(file => `/uploads/spaces/${file.filename}`);
    return { urls };
  }

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
