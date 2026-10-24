import { NestFactory } from '@nestjs/core';
import { API_PORT, WEB_PORT } from '@rich/constants';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // 종료 시그널을 받으면 DB 연결 등을 정리한다.
  app.enableShutdownHooks();
  app.enableCors({ origin: process.env.CORS_ORIGIN ?? `http://localhost:${WEB_PORT}` });
  await app.listen(process.env.PORT ?? API_PORT);
}
void bootstrap();
