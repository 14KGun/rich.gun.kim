import { NestFactory } from '@nestjs/core';
import { API_PORT, WEB_PORT } from '@rich/constants';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: process.env.CORS_ORIGIN ?? `http://localhost:${WEB_PORT}` });
  await app.listen(process.env.PORT ?? API_PORT);
}
void bootstrap();
