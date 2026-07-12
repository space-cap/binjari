import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('v1');
  
  // CORS 활성화
  app.enableCors({
    origin: ['http://localhost:3000', 'https://binjari.kr'],
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
