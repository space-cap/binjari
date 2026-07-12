import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';

// 공간 이미지 업로드 타겟 경로
export const UPLOAD_DIR = './uploads/spaces';

export const multerOptions = {
  storage: diskStorage({
    destination: (req, file, cb) => {
      // 업로드 디렉토리가 없으면 동적으로 생성
      if (!fs.existsSync(UPLOAD_DIR)) {
        fs.mkdirSync(UPLOAD_DIR, { recursive: true });
      }
      cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
      // 고유 파일명 생성
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = extname(file.originalname);
      cb(null, `space-${uniqueSuffix}${ext}`);
    },
  }),
  fileFilter: (req, file, cb) => {
    // 이미지 확장자만 허용
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      return cb(new Error('이미지 파일만 업로드할 수 있습니다.'), false);
    }
    cb(null, true);
  },
};
